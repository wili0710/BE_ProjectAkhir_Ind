const {db}=require('../connections')

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

const getcart=async(user_id)=>{
    // Get All Transaksi parcel dan satuan.
    // Selanjutnya get sesuai parcel atau product id yg bukan 0
    let sql=`select * from transaksi
    where status='oncart' and users_id=${db.escape(user_id)}`
    const gettransaksi=await DbPROMselect(sql)
    
    sql=`select td.transaksi_id as transaksi_id,products_id, nama, image, td.id as transaksidetail_id, harga as hargasatuan, 
    td.hargatotal, td.qty from transaksi t
    join transaksidetail td on td.transaksi_id=t.id
    join products p on p.id=td.products_id
    where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.parcel_id=0;`
    const gettransaksidetailsatuan=await DbPROMselect(sql)
    
    sql=`select td.transaksi_id as transaksi_id,td.parcel_id, nama, gambar, td.id as transaksidetail_id, harga as hargasatuan, 
    td.hargatotal, td.qty, td.message from transaksi t
    join transaksidetail td on td.transaksi_id=t.id
    join parcel p on p.id=td.parcel_id
    where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0;`
    const gettransaksiparcel=await DbPROMselect(sql)

    sql=`select td.transaksi_id as transaksi_id,td.id as transaksidetail_id,td.parcel_id as parcel_id, 
    td.qty as qtyparcel,td.hargatotal, 
    pa.nama as namaparcel, pa.harga as hargaparcel, tdhp.id as productinparcel_id,
    tdhp.products_id as products_id, p.nama as namaproduct, tdhp.qty as qtyproduct, p.categoryproduct_id, cp.nama as category  from transaksi t
    join transaksidetail td on td.transaksi_id=t.id
    join transaksidetail_has_products tdhp on tdhp.transaksidetail_id=td.id
    join products p on p.id=tdhp.products_id
    join parcel pa on pa.id=td.parcel_id
    join categoryproduct cp on cp.id=p.categoryproduct_id
    where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0; `
    const gettransaksidetailparcel=await DbPROMselect(sql)

    const getcart={
        transaksi:gettransaksi,
        transaksidetailsatuan:gettransaksidetailsatuan,
        transaksiparcel:gettransaksiparcel,
        transaksidetailparcel:gettransaksidetailparcel
    }

    return getcart
}

module.exports=getcart