const {db}=require('../connections')

// Tambahan utk Report Controller

// query ambil income perhari
// query ambil income perbulan
// query ambil income perminggu


const DBTransaction=()=>{
    return new Promise((resolve,reject)=>{
        db.beginTransaction((err)=>{
            if(err){
                reject(err)
            }else{
                resolve()
            }
        })
    })
}
const DbPROMselect=(sql)=>{
    return new Promise((resolve,reject)=>{
        db.query(sql,(err,results)=>{
            if(err){
                reject(err)
            }else{
                resolve(results)
            }
        })
    })
}
module.exports={
    IncomeReport:async(req,res)=>{
        try {
            // -- Potensi Penjualan Keseluruhan
            let sql=`select sum(totaltransaksi) as PotensiPenjualan from transaksi;`
            const PotensiPenjualan=await DbPROMselect(sql)
            
            // -- Penjualan Keseluruhan
            sql=`select sum(totaltransaksi) as Penjualan from transaksi
            where status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi");`
            const Penjualan=await DbPROMselect(sql)

            // -- Pendapatan Bersih keseluruhan
            sql=`select sum(totaltransaksi-totalmodal) as Pendapatan from transaksi
            where status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi");`
            const Pendapatan=await DbPROMselect(sql)

            // -- Pendapatan Kotor dari Barang Satuan yg sudah onsent dan completed
            sql=`select sum(td.hargatotal) as Penjualan_Satuan from transaksi t 
            join transaksidetail td on t.id=td.transaksi_id
            where status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi") and td.isdeleted=0 and td.parcel_id=0;`
            const Penjualan_Satuan=await DbPROMselect(sql)

            // -- Pendapatan Bersih dari Barang Satuan yg sudah onsent dan completed
            sql=`select sum(td.hargatotal-td.modal) as Pendapatan_Satuan from transaksi t 
            join transaksidetail td on t.id=td.transaksi_id
            where status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi") and td.isdeleted=0 and td.parcel_id=0;`
            const Pendapatan_Satuan=await DbPROMselect(sql)

            // -- Penjualan dari Parcel yang sudah onsent dan completed
            sql=`select sum(td.hargatotal) as Penjualan_Parcel from transaksi t 
            join transaksidetail td on t.id=td.transaksi_id
            where status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi") and td.isdeleted=0 and td.products_id=0;`
            const Penjualan_Parcel=await DbPROMselect(sql)

            // -- Pendapatan bersih dari parcel yang sudah onsent dan completed
            sql=`select sum(td.hargatotal-td.modal) as Pendapatan_Parcel from transaksi t 
            join transaksidetail td on t.id=td.transaksi_id
            where status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi") and td.isdeleted=0 and td.products_id=0;`
            const Pendapatan_Parcel=await DbPROMselect(sql)

            const senttofe={
                PotensiPenjualan:PotensiPenjualan[0].PotensiPenjualan,
                Penjualan:Penjualan[0].Penjualan,
                Pendapatan:Pendapatan[0].Pendapatan,
                Penjualan_Satuan:Penjualan_Satuan[0].Penjualan_Satuan,
                Pendapatan_Satuan:Pendapatan_Satuan[0].Pendapatan_Satuan,
                Penjualan_Parcel:Penjualan_Parcel[0].Penjualan_Parcel,
                Pendapatan_Parcel:Pendapatan_Parcel[0].Pendapatan_Parcel
            }
            console.log(senttofe)
            res.send(senttofe)
        } catch (error) {
            return res.status(500).send({message:error.message})
        }
    },
    ProductReport:async(req,res)=>{
        try {
            let {page}=req.query
            let ItemProductFavorit
            let ParcelFavorit
            if(page){
                //-- Item Product Favorit Terjual ( Satuan )
                let sql=`select sum(qty) as qty,products_id,p.nama,p.image from (
                    select qty,products_id from transaksidetail td
                    join transaksi t on t.id=td.transaksi_id
                    where td.parcel_id=0 and isdeleted=0 and t.status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi")
                    union all
                    select tdhp.qty,tdhp.products_id from transaksidetail_has_products tdhp
                    join transaksidetail td on td.id=tdhp.transaksidetail_id
                    join transaksi t on t.id=td.transaksi_id
                    where td.parcel_id=0 and isdeleted=0 and t.status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi")) ini
                    join products p on p.id=ini.products_id
                    group by products_id
                    order by qty DESC
                    limit ${(page-1)*10},10;`
                ItemProductFavorit=await DbPROMselect(sql)

                // -- Parcel Paket Favorit
                sql=`select sum(qty) as qty, p.nama,p.gambar from transaksidetail td
                join parcel p on p.id=td.parcel_id
                join transaksi t on t.id=td.transaksi_id
                where td.products_id=0 and td.isdeleted=0 and t.status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi")
                group by parcel_id 
                order by qty desc
                limit ${(page-1)*10},10;`
                ParcelFavorit=await DbPROMselect(sql)
            }else{
                //-- Item Product Favorit Terjual ( Satuan )
                let sql=`select sum(qty) as qty,products_id,p.nama,p.image from (
                    select qty,products_id from transaksidetail td
                    join transaksi t on t.id=td.transaksi_id
                    where td.parcel_id=0 and isdeleted=0 and t.status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi")
                    union all
                    select tdhp.qty,tdhp.products_id from transaksidetail_has_products tdhp
                    join transaksidetail td on td.id=tdhp.transaksidetail_id
                    join transaksi t on t.id=td.transaksi_id
                    where td.parcel_id=0 and isdeleted=0 and t.status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi")) ini
                    join products p on p.id=ini.products_id
                    group by products_id
                    order by qty DESC;`
                ItemProductFavorit=await DbPROMselect(sql)
                
                // -- Parcel Paket Favorit
                sql=`select sum(qty) as qty, p.nama,p.gambar from transaksidetail td
                join parcel p on p.id=td.parcel_id
                join transaksi t on t.id=td.transaksi_id
                where td.products_id=0 and td.isdeleted=0 and t.status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi")
                group by parcel_id 
                order by qty desc;`
                ParcelFavorit=await DbPROMselect(sql)

            }

            const senttofe={
                ItemProductFavorit:ItemProductFavorit,
                ParcelFavorit:ParcelFavorit
            }
            console.log(senttofe)
            res.send(senttofe)
        } catch (error) {
            console.log(error)
            return res.status(500).send({message:error.message})
        }
    },
    TransaksiReport:async(req,res)=>{
        try {
            let {page}=req.query
            let getTransaksi
            let getTransaksiDetail
            if(page){
                let sql=`select * from transaksi where status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi") order by id desc limit ${(page-1)*5},5`
                getTransaksi=await DbPROMselect(sql)
                sql =`select * from transaksidetail td
                    join transaksi t on t.id=td.transaksi_id
                    join parcel p on p.id=td.parcel_id
                    where td.products_id=0 and t.status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi") order by td.id desc
                    limit ${(page-1)*5},5`
                getTransaksiDetail= await DbPROMselect(sql)
            }else{
                let sql=`select * from transaksi where status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi") order by id desc`
                getTransaksi=await DbPROMselect(sql)
                sql =`select * from transaksidetail td
                    join transaksi t on t.id=td.transaksi_id
                    join parcel p on p.id=td.parcel_id
                    where td.products_id=0 and t.status not in  ("Belum Dibayar","oncart","Menunggu Konfirmasi") order by td.id desc`
                getTransaksiDetail= await DbPROMselect(sql)
            }

            let senttofe={
                transaksi:getTransaksi,
                transaksiDetail:getTransaksiDetail
            }
            res.send(senttofe)
        } catch (error) {
            console.log(error)
            res.send(error)
            
        }
    }
}












