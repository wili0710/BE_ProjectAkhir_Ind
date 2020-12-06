const {db}=require('../connections')

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
            where status in  ("onsent","completed");`
            const Penjualan=await DbPROMselect(sql)

            // -- Pendapatan Bersih keseluruhan
            sql=`select sum(totaltransaksi-totalmodal) as Pendapatan from transaksi
            where status in ("onsent","completed");`
            const Pendapatan=await DbPROMselect(sql)

            // -- Pendapatan Kotor dari Barang Satuan yg sudah onsent dan completed
            sql=`select sum(td.hargatotal) as Penjualan_Satuan from transaksi t 
            join transaksidetail td on t.id=td.transaksi_id
            where status in ("onsent","completed") and td.isdeleted=0 and td.parcel_id=0;`
            const Penjualan_Satuan=await DbPROMselect(sql)

            // -- Pendapatan Bersih dari Barang Satuan yg sudah onsent dan completed
            sql=`select sum(td.hargatotal-td.modal) as Pendapatan_Satuan from transaksi t 
            join transaksidetail td on t.id=td.transaksi_id
            where status in ("onsent","completed") and td.isdeleted=0 and td.parcel_id=0;`
            const Pendapatan_Satuan=await DbPROMselect(sql)

            // -- Penjualan dari Parcel yang sudah onsent dan completed
            sql=`select sum(td.hargatotal) as Penjualan_Parcel from transaksi t 
            join transaksidetail td on t.id=td.transaksi_id
            where status in ("onsent","completed") and td.isdeleted=0 and td.products_id=0;`
            const Penjualan_Parcel=await DbPROMselect(sql)

            // -- Pendapatan bersih dari parcel yang sudah onsent dan completed
            sql=`select sum(td.hargatotal-td.modal) as Pendapatan_Parcel from transaksi t 
            join transaksidetail td on t.id=td.transaksi_id
            where status in ("onsent","completed") and td.isdeleted=0 and td.products_id=0;`
            const Pendapatan_Parcel=await DbPROMselect(sql)

            const senttofe={
                PotensiPenjualan:PotensiPenjualan[0].PotensiPenjualan,
                Penjualan:Penjualan,
                Pendapatan:Pendapatan,
                Penjualan_Satuan:Penjualan_Satuan,
                Pendapatan_Satuan:Pendapatan_Satuan,
                Penjualan_Parcel:Penjualan_Parcel,
                Pendapatan_Parcel:Pendapatan_Parcel
            }

            res.send(senttofe)
        } catch (error) {
            return res.status(500).send({message:error.message})
        }
    },
    ProductReport:async(req,res)=>{
        try {
            //-- Item Product Favorit Terjual ( Satuan )
            let sql=`select sum(qty) as qty,products_id,p.nama,p.image from (
                select qty,products_id from transaksidetail td
                where td.parcel_id=0 and isdeleted=0
                union all
                select qty,products_id from transaksidetail_has_products tdhp) ini
                join products p on p.id=ini.products_id
                group by products_id
                order by qty DESC;`
            const ItemProductFavorit=await DbPROMselect(sql)
            
            // -- Parcel Paket Favorit
            sql=`select sum(qty) as qty, p.nama,p.gambar from transaksidetail td
            join parcel p on p.id=td.parcel_id
            where td.products_id=0
            group by parcel_id 
            order by qty desc;`
            const ParcelFavorit=await DbPROMselect(sql)

            const senttofe={
                ItemProductFavorit:ItemProductFavorit,
                ParcelFavorit:ParcelFavorit
            }
            res.send(senttofe)
        } catch (error) {
            return res.status(500).send({message:error.message})
        }
    }
}














