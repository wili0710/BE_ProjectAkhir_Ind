const {db}=require('../connections')
const { getcart,gettransaksilist } = require('../helpers')
const { trace } = require('../routes/AuthRoutes')

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
const DBCommit=()=>{
    return new Promise((resolve,reject)=>{
        db.commit((err)=>{
            if(err){
                console.log("ROLL BACK DB")
                return db.rollback(()=>{
                    reject(err)
                })
            } else{
                console.log("Save DB")
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
    // add to cart untuk nambah qty per product
    AddToCartProduct:async(req,res)=>{
        const {user_id,products_id,parcel_id,qty,productforparcel_id,qtyproductforparcel,transaksidetail_id,message}=req.body
        let sql= `select * from transaksi where status='oncart' and users_id=${db.escape(user_id)}`
        try {
            await DBTransaction()
            const getdatatransaksi=await DbPROMselect(sql)
    
            if (getdatatransaksi.length){
                if(parcel_id==0){
                    sql=`select * from transaksidetail where products_id=${db.escape(products_id)} 
                        and transaksi_id=${db.escape(getdatatransaksi[0].id)} and parcel_id=${db.escape(parcel_id)} and isdeleted=0`
                    const getdatatransaksidetail=await DbPROMselect(sql)

                    if(getdatatransaksidetail.length){
                        let senttosql={
                            qty:parseInt(qty) + getdatatransaksidetail[0].qty,
                            lastupdate:new Date()
                        }
                        sql=`update transaksidetail set ${db.escape(senttosql)} 
                        where products_id=${db.escape(getdatatransaksidetail[0].products_id)}
                        and transaksi_id=${db.escape(getdatatransaksidetail[0].transaksi_id)}`
                        const updatedata=await DbPROMselect(sql)
    
                        sql=`select td.qty*p.harga as totalharga, td.qty*p.hargapokok as modal from transaksidetail td
                            join products p on p.id=td.products_id
                            where td.id=${db.escape(getdatatransaksidetail[0].id)}`
                        const addhargatotal=await DbPROMselect(sql)
                        
                        senttosql={
                            hargatotal:addhargatotal[0].totalharga,
                            modal:addhargatotal[0].modal
                        }
                        sql=`update transaksidetail set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksidetail[0].id)}`
                        const updatetransaksidetail=await DbPROMselect(sql)

                        sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
                        where transaksi_id=${db.escape(getdatatransaksi[0].id)} and isdeleted=0;`
                        const updatetotaltransaksi=await DbPROMselect(sql)

                        senttosql={
                            totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                            totalmodal:updatetotaltransaksi[0].totalmodal
                        }
                        sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksi[0].id)}`
                        const updatetransaksi=await DbPROMselect(sql)

                    }else {
                        let senttosql={
                            products_id:products_id,
                            transaksi_id:getdatatransaksi[0].id,
                            parcel_id:parcel_id,
                            qty:qty,
                            lastupdate:new Date()
                        }
                        sql=`insert into transaksidetail set ${db.escape(senttosql)}`
                        const addproductocart=await DbPROMselect(sql)
    
                        sql=`select td.qty*p.harga as totalharga, td.qty*p.hargapokok as modal from transaksidetail td
                            join products p on p.id=td.products_id
                            where td.id=${db.escape(addproductocart.insertId)}`
                        const addhargatotal=await DbPROMselect(sql)
                        senttosql={
                            hargatotal:addhargatotal[0].totalharga,
                            modal:addhargatotal[0].modal
                        }
                        sql=`update transaksidetail set ${db.escape(senttosql)}
                            where id=${db.escape(addproductocart.insertId)}`
                        const updatehargatotal=await DbPROMselect(sql)
    
                        sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
                        where transaksi_id=${db.escape(getdatatransaksi[0].id)} and isdeleted=0;`
                        const updatetotaltransaksi=await DbPROMselect(sql)

                        senttosql={
                            totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                            totalmodal:updatetotaltransaksi[0].totalmodal
                        }

                        sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksi[0].id)}`
                        const updatetransaksi=await DbPROMselect(sql)
                        }            
                    }
                }else {
                    let senttosql={
                        lastupdate:new Date(),
                        status:'oncart',
                        users_id:user_id
                    }
                    sql=`insert into transaksi set ${db.escape(senttosql)}`
                    const addcart=await DbPROMselect(sql)
                        senttosql={
                            products_id:products_id,
                            transaksi_id:addcart.insertId,
                            parcel_id:parcel_id,
                            qty:qty,
                            lastupdate:new Date()
                        }
                        sql=`insert into transaksidetail set ${db.escape(senttosql)}`
                        const addtotransaksidetail=await DbPROMselect(sql)
                        sql=`select td.qty*p.harga as totalharga, td.qty*p.hargapokok as modal from transaksidetail td
                            join products p on p.id=td.products_id
                            where td.id=${db.escape(addtotransaksidetail.insertId)}`
                        const addhargatotal=await DbPROMselect(sql)
                        senttosql={
                            hargatotal:addhargatotal[0].totalharga,
                            modal:addhargatotal[0].modal
                        }
                        sql=`update transaksidetail set ${db.escape(senttosql)}
                            where id=${db.escape(addtotransaksidetail.insertId)}`
                        const updatehargatotal=await DbPROMselect(sql)
    
                        sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
                            where transaksi_id=${db.escape(addcart.insertId)} and isdeleted=0;`
                        const updatetotaltransaksi=await DbPROMselect(sql)
    
                        senttosql={
                            totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                            totalmodal:updatetotaltransaksi[0].totalmodal
                        }
    
                        sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(addcart.insertId)}`
                        const updatetransaksi=await DbPROMselect(sql)
                
                    }
                    db.commit((err)=>{
                        if(err){
                            return db.rollback(()=>{
                                res.status(500).send(err)
                            })
                        } 
                    })
                   
                    let sendfront=await getcart(user_id)

                    // Get All Transaksi parcel dan satuan.
                    // Selanjutnya get sesuai parcel atau product id yg bukan 0
                    // sql=`select * from transaksi
                    // where status='oncart' and users_id=${db.escape(user_id)}`
                    // const gettransaksi=await DbPROMselect(sql)
                    
                    // sql=`select td.transaksi_id as transaksi_id,products_id, nama, image, td.id as transaksidetail_id, harga as hargasatuan, 
                    // td.hargatotal, td.qty from transaksi t
                    // join transaksidetail td on td.transaksi_id=t.id
                    // join products p on p.id=td.products_id
                    // where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.parcel_id=0;`
                    // const gettransaksidetailsatuan=await DbPROMselect(sql)
        
                    // sql=`select td.transaksi_id as transaksi_id,td.parcel_id, nama, gambar, td.id as transaksidetail_id, harga as hargasatuan, 
                    // td.hargatotal, td.qty, td.message from transaksi t
                    // join transaksidetail td on td.transaksi_id=t.id
                    // join parcel p on p.id=td.parcel_id
                    // where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0;`
                    // const gettransaksiparcel=await DbPROMselect(sql)
        
                    // sql=`select td.transaksi_id as transaksi_id,td.id as transaksidetail_id,td.parcel_id as parcel_id, 
                    // td.qty as qtyparcel,td.hargatotal, 
                    // pa.nama as namaparcel, pa.harga as hargaparcel, tdhp.id as productinparcel_id,
                    // tdhp.products_id as products_id, p.nama as namaproduct, tdhp.qty as qtyproduct, p.categoryproduct_id, cp.nama as category  from transaksi t
                    // join transaksidetail td on td.transaksi_id=t.id
                    // join transaksidetail_has_products tdhp on tdhp.transaksidetail_id=td.id
                    // join products p on p.id=tdhp.products_id
                    // join parcel pa on pa.id=td.parcel_id
                    // join categoryproduct cp on cp.id=p.categoryproduct_id
                    // where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0; `
                    // const gettransaksidetailparcel=await DbPROMselect(sql)
                    
                    // const getcart={
                    //     transaksi:gettransaksi,
                    //     transaksidetailsatuan:gettransaksidetailsatuan,
                    //     transaksiparcel:gettransaksiparcel,
                    //     transaksidetailparcel:gettransaksidetailparcel
                    // }
                    return res.send(sendfront)

        }catch(error){
            console.log(error)
        }
    },

    // AddToCart tidak menambah QTY tetapi mengupdate QTY
    AddToCart:async(req,res)=>{
        const {user_id,products_id,parcel_id,qty,productforparcel_id,qtyproductforparcel,transaksidetail_id,message}=req.body
        let sql= `select * from transaksi where status='oncart' and users_id=${db.escape(user_id)}`
        try {
            await DBTransaction()
            const getdatatransaksi=await DbPROMselect(sql)
            
            // Jika cart sudah ada transaksi
            
            if (getdatatransaksi.length){

                // untuk bukan parcel beli product satuan

                if(parcel_id==0){ 
                    sql=`select * from transaksidetail where products_id=${db.escape(products_id)} 
                        and transaksi_id=${db.escape(getdatatransaksi[0].id)} and parcel_id=${db.escape(parcel_id)} and isdeleted=0`
                    const getdatatransaksidetail=await DbPROMselect(sql)

                    if(getdatatransaksidetail.length){
                        let senttosql={
                            qty:parseInt(qty),
                            lastupdate:new Date()
                        }
                        sql=`update transaksidetail set ${db.escape(senttosql)} 
                        where products_id=${db.escape(getdatatransaksidetail[0].products_id)}
                        and transaksi_id=${db.escape(getdatatransaksidetail[0].transaksi_id)}`
                        const updatedata=await DbPROMselect(sql)
    
                        sql=`select td.qty*p.harga as totalharga, td.qty*p.hargapokok as modal from transaksidetail td
                            join products p on p.id=td.products_id
                            where td.id=${db.escape(getdatatransaksidetail[0].id)}`
                        const addhargatotal=await DbPROMselect(sql)
                        
                        senttosql={
                            hargatotal:addhargatotal[0].totalharga,
                            modal:addhargatotal[0].modal
                        }
                        sql=`update transaksidetail set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksidetail[0].id)}`
                        const updatetransaksidetail=await DbPROMselect(sql)

                        sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
                        where transaksi_id=${db.escape(getdatatransaksi[0].id)} and isdeleted=0;`
                        const updatetotaltransaksi=await DbPROMselect(sql)

                        senttosql={
                            totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                            totalmodal:updatetotaltransaksi[0].totalmodal
                        }
                        sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksi[0].id)}`
                        const updatetransaksi=await DbPROMselect(sql)
    
                    }else{
                        let senttosql={
                            products_id:products_id,
                            transaksi_id:getdatatransaksi[0].id,
                            parcel_id:parcel_id,
                            qty:qty,
                            lastupdate:new Date()
                        }
                        sql=`insert into transaksidetail set ${db.escape(senttosql)}`
                        const addproductocart=await DbPROMselect(sql)
    
                        sql=`select td.qty*p.harga as totalharga, td.qty*p.hargapokok as modal from transaksidetail td
                            join products p on p.id=td.products_id
                            where td.id=${db.escape(addproductocart.insertId)}`
                        const addhargatotal=await DbPROMselect(sql)
                        senttosql={
                            hargatotal:addhargatotal[0].totalharga,
                            modal:addhargatotal[0].modal
                        }
                        sql=`update transaksidetail set ${db.escape(senttosql)}
                            where id=${db.escape(addproductocart.insertId)}`
                        const updatehargatotal=await DbPROMselect(sql)
    
                        sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
                        where transaksi_id=${db.escape(getdatatransaksi[0].id)} and isdeleted=0;`
                        const updatetotaltransaksi=await DbPROMselect(sql)

                        senttosql={
                            totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                            totalmodal:updatetotaltransaksi[0].totalmodal
                        }

                        sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksi[0].id)}`
                        const updatetransaksi=await DbPROMselect(sql)

                    }
                }else{

                    console.log("cart ada masuk ke parcel")
                    // Jika cart sudah ada, tambah parcel

                    sql=`select td.id from transaksidetail td
                        join transaksidetail_has_products tdhp
                        on tdhp.transaksidetail_id=td.id
                        where td.id=${db.escape(transaksidetail_id)}
                        and td.transaksi_id=${db.escape(getdatatransaksi[0].id)} and td.parcel_id=${db.escape(parcel_id)} and td.isdeleted=0`
                    const getdatatransaksidetail=await DbPROMselect(sql)

                    
                    // Edit parcel

                    if(getdatatransaksidetail.length){    

                        console.log("edit parcel")

                        sql=`select * from parcel where id=${parcel_id}`
                        const getparcel=await DbPROMselect(sql)                
                        senttosql={
                            qty:parseInt(qty),
                            hargatotal:getparcel[0].harga*qty,
                            message:message,
                            lastupdate:new Date()
                        }
                        sql=`update transaksidetail set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksidetail[0].id)}`
                        const updatetransaksidetail=await DbPROMselect(sql)

                        // ambil semua ID Product di parcel dengan Transaksi Detail ID.

                        // sql=`select * from transaksidetail_has_products 
                        // where transaksidetail_id=${getdatatransaksidetail[0].id}`
                        // const gettdid=await DbPROMselect(sql)

                        // Hapus id product lama

                        sql=`delete from transaksidetail_has_products where transaksidetail_id = ${db.escape(getdatatransaksidetail[0].id)}`
                        const deleteOldItem=DbPROMselect(sql)

                        for(let x=1;x<=productforparcel_id.length;x++){
                            senttosql={
                                transaksidetail_id:getdatatransaksidetail[0].id,
                                products_id:productforparcel_id[x-1],
                                qty:qtyproductforparcel[x-1]*qty,
                            }
                            sql=`insert into transaksidetail_has_products set ${db.escape(senttosql)}`
                            const addproductinparcel=await DbPROMselect(sql)

                        }

                        for(let x=1;x<=productforparcel_id.length;x++){
                            sql=`select tdhp.qty*p.hargapokok as hargatotalpokok from transaksidetail_has_products tdhp
                                join products p on p.id=tdhp.products_id
                                where tdhp.transaksidetail_id=${db.escape(getdatatransaksidetail[0].id)} 
                                and tdhp.products_id=${productforparcel_id[x-1]}`
                            const addhargatotal=await DbPROMselect(sql)
                            senttosql={
                                hargatotalpokok:addhargatotal[0].hargatotalpokok
                            }
                            
                            sql=`update transaksidetail_has_products set ${db.escape(senttosql)}
                            where transaksidetail_id=${db.escape(getdatatransaksidetail[0].id)} and products_id=${productforparcel_id[x-1]}`
                            const updatehargatotal=await DbPROMselect(sql)
                        }
                        
                        sql=`select sum(hargatotalpokok) as modalparcel from transaksidetail_has_products 
                        where transaksidetail_id=${db.escape(getdatatransaksidetail[0].id)}`
                        const getmodalparcel=await DbPROMselect(sql)

                        senttosql={modal:getmodalparcel[0].modalparcel}
                        sql=`update transaksidetail set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksidetail[0].id)}`
                        const updatemodalparcel=await DbPROMselect(sql)

                        sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
                        where transaksi_id=${db.escape(getdatatransaksi[0].id)} and isdeleted=0;`
                        const updatetotaltransaksi=await DbPROMselect(sql)

                        senttosql={
                            totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                            totalmodal:updatetotaltransaksi[0].totalmodal,
                            lastupdate:new Date()
                        }

                        sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksi[0].id)}`
                        const updatetransaksi=await DbPROMselect(sql)

                    }else{
                        sql=`select * from parcel where id=${parcel_id}`
                        const getparcel=await DbPROMselect(sql)
                        let senttosql={
                            products_id:products_id,
                            parcel_id:parcel_id,
                            qty:qty,
                            transaksi_id:getdatatransaksi[0].id,
                            lastupdate:new Date(),
                            hargatotal:getparcel[0].harga*qty,
                            message:message
                        }
                        sql=`insert into transaksidetail set ${db.escape(senttosql)}`
                        const addproductocart=await DbPROMselect(sql)
    
                        for(let x=1;x<=productforparcel_id.length;x++){
                            senttosql={
                                transaksidetail_id:addproductocart.insertId,
                                products_id:productforparcel_id[x-1],
                                qty:qtyproductforparcel[x-1]*qty,
                            }
                            sql=`insert into transaksidetail_has_products set ${db.escape(senttosql)}`
                            const addproductinparcel=await DbPROMselect(sql)
                        }
    
                        for(let x=1;x<=productforparcel_id.length;x++){
                            sql=`select tdhp.qty*p.hargapokok as hargatotalpokok from transaksidetail_has_products tdhp
                                join products p on p.id=tdhp.products_id
                                where tdhp.transaksidetail_id=${db.escape(addproductocart.insertId)} 
                                and tdhp.products_id=${productforparcel_id[x-1]}`
                            const addhargatotal=await DbPROMselect(sql)

                            senttosql={
                                hargatotalpokok:addhargatotal[0].hargatotalpokok
                            }
                            sql=`update transaksidetail_has_products set ${db.escape(senttosql)}
                            where transaksidetail_id=${db.escape(addproductocart.insertId)} and products_id=${productforparcel_id[x-1]}`
                            const updatehargatotal=await DbPROMselect(sql)
                        }

                        sql=`select sum(hargatotalpokok) as modalparcel from transaksidetail_has_products 
                        where transaksidetail_id=${db.escape(addproductocart.insertId)}`
                        const getmodalparcel=await DbPROMselect(sql)

                        senttosql={modal:getmodalparcel[0].modalparcel}
                        sql=`update transaksidetail set ${db.escape(senttosql)} where id=${db.escape(addproductocart.insertId)}`
                        const updatemodalparcel=await DbPROMselect(sql)

                        
                        sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
                        where transaksi_id=${db.escape(getdatatransaksi[0].id)} and isdeleted=0;`
                        const updatetotaltransaksi=await DbPROMselect(sql)

                        senttosql={
                            totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                            totalmodal:updatetotaltransaksi[0].totalmodal,
                            lastupdate:new Date()
                        }

                        sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksi[0].id)}`
                        const updatetransaksi=await DbPROMselect(sql)

                    }
                }
            }else{
                // klo cart masih kosong
                let senttosql={
                    lastupdate:new Date(),
                    status:'oncart',
                    users_id:user_id
                }
                sql=`insert into transaksi set ${db.escape(senttosql)}`
                const addcart=await DbPROMselect(sql)

                // Cart kosong, tambah product satuan
                if(parcel_id==0){
                    senttosql={
                        products_id:products_id,
                        transaksi_id:addcart.insertId,
                        parcel_id:parcel_id,
                        qty:qty,
                        lastupdate:new Date()
                    }
                    sql=`insert into transaksidetail set ${db.escape(senttosql)}`
                    const addtotransaksidetail=await DbPROMselect(sql)
                    sql=`select td.qty*p.harga as totalharga, td.qty*p.hargapokok as modal from transaksidetail td
                        join products p on p.id=td.products_id
                        where td.id=${db.escape(addtotransaksidetail.insertId)}`
                    const addhargatotal=await DbPROMselect(sql)
                    senttosql={
                        hargatotal:addhargatotal[0].totalharga,
                        modal:addhargatotal[0].modal
                    }
                    sql=`update transaksidetail set ${db.escape(senttosql)}
                        where id=${db.escape(addtotransaksidetail.insertId)}`
                    const updatehargatotal=await DbPROMselect(sql)

                    sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
                        where transaksi_id=${db.escape(addcart.insertId)} and isdeleted=0;`
                    const updatetotaltransaksi=await DbPROMselect(sql)

                    senttosql={
                        totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                        totalmodal:updatetotaltransaksi[0].totalmodal
                    }

                    sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(addcart.insertId)}`
                    const updatetransaksi=await DbPROMselect(sql)

                    

                }else{
                    // Cart kosong, tambah product parcel

                    sql=`select * from parcel where id=${parcel_id}`
                    const getparcel=await DbPROMselect(sql)
                    senttosql={
                        products_id:products_id,
                        transaksi_id:addcart.insertId,
                        parcel_id:parcel_id,
                        qty:qty,
                        lastupdate:new Date(),
                        hargatotal:getparcel[0].harga*qty,
                        message:message
                    }
                    sql=`insert into transaksidetail set ${db.escape(senttosql)}`
                    const addtotransaksidetail=await DbPROMselect(sql)

                    
                    for(let x=1;x<=productforparcel_id.length;x++){
                        senttosql={
                            transaksidetail_id:addtotransaksidetail.insertId,
                            products_id:productforparcel_id[x-1],
                            qty:qtyproductforparcel[x-1]*qty,
                        }
                        sql=`insert into transaksidetail_has_products set ${db.escape(senttosql)}`
                        const addproductinparcel=await DbPROMselect(sql)
                    }
    
                    
                    for(let x=1;x<=productforparcel_id.length;x++){
                        sql=`select tdhp.qty*p.hargapokok as hargatotalpokok from transaksidetail_has_products tdhp
                            join products p on p.id=tdhp.products_id
                            where tdhp.transaksidetail_id=${db.escape(addtotransaksidetail.insertId)} 
                            and tdhp.products_id=${productforparcel_id[x-1]}`
                        const addhargatotal=await DbPROMselect(sql)
                        senttosql={
                            hargatotalpokok:addhargatotal[0].hargatotalpokok
                        }
                        sql=`update transaksidetail_has_products set ${db.escape(senttosql)}
                        where transaksidetail_id=${db.escape(addtotransaksidetail.insertId)} and products_id=${productforparcel_id[x-1]}`
                        const updatehargatotal=await DbPROMselect(sql)
                    }

                    sql=`select sum(hargatotalpokok) as modalparcel from transaksidetail_has_products 
                    where transaksidetail_id=${db.escape(addtotransaksidetail.insertId)}`
                    const getmodalparcel=await DbPROMselect(sql)

                    senttosql={modal:getmodalparcel[0].modalparcel}
                    sql=`update transaksidetail set ${db.escape(senttosql)} where id=${db.escape(addtotransaksidetail.insertId)}`
                    const updatemodalparcel=await DbPROMselect(sql)

                    sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
                        where transaksi_id=${db.escape(addcart.insertId)} and isdeleted=0;`
                    const updatetotaltransaksi=await DbPROMselect(sql)

                    senttosql={
                        totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                        totalmodal:updatetotaltransaksi[0].totalmodal
                    }

                    sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(addcart.insertId)}`
                    const updatetransaksi=await DbPROMselect(sql)
                }
    
            }

            await DBCommit()

            let sendfront=await getcart(user_id)

            // Get All Transaksi parcel dan satuan.
            // Selanjutnya get sesuai parcel atau product id yg bukan 0
            // sql=`select * from transaksi
            // where status='oncart' and users_id=${db.escape(user_id)}`
            // const gettransaksi=await DbPROMselect(sql)
            
            // sql=`select td.transaksi_id as transaksi_id,products_id, nama, image, td.id as transaksidetail_id, harga as hargasatuan, 
            // td.hargatotal, td.qty from transaksi t
            // join transaksidetail td on td.transaksi_id=t.id
            // join products p on p.id=td.products_id
            // where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.parcel_id=0;`
            // const gettransaksidetailsatuan=await DbPROMselect(sql)

            // sql=`select td.transaksi_id as transaksi_id,td.parcel_id, nama, gambar, td.id as transaksidetail_id, harga as hargasatuan, 
            // td.hargatotal, td.qty, td.message from transaksi t
            // join transaksidetail td on td.transaksi_id=t.id
            // join parcel p on p.id=td.parcel_id
            // where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0;`
            // const gettransaksiparcel=await DbPROMselect(sql)

            // sql=`select td.transaksi_id as transaksi_id,td.id as transaksidetail_id,td.parcel_id as parcel_id, 
            // td.qty as qtyparcel,td.hargatotal, 
            // pa.nama as namaparcel, pa.harga as hargaparcel, tdhp.id as productinparcel_id,
            // tdhp.products_id as products_id, p.nama as namaproduct, tdhp.qty as qtyproduct, p.categoryproduct_id, cp.nama as category  from transaksi t
            // join transaksidetail td on td.transaksi_id=t.id
            // join transaksidetail_has_products tdhp on tdhp.transaksidetail_id=td.id
            // join products p on p.id=tdhp.products_id
            // join parcel pa on pa.id=td.parcel_id
            // join categoryproduct cp on cp.id=p.categoryproduct_id
            // where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0; `
            // const gettransaksidetailparcel=await DbPROMselect(sql)
            
            // const getcart={
            //     transaksi:gettransaksi,
            //     transaksidetailsatuan:gettransaksidetailsatuan,
            //     transaksiparcel:gettransaksiparcel,
            //     transaksidetailparcel:gettransaksidetailparcel
            // }
            return res.send(sendfront)
        } catch (error) {
            console.log(error)
            return res.status(500).send({message:error.message})
        }
    },
    GetCart:async(req,res)=>{

        const {user_id}=req.query
        try {
            sql=`select * from transaksi where users_id=${user_id} and status="oncart"`
            const isOncart=await DbPROMselect(sql)
            if(isOncart.length){
                sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
                where transaksi_id=${db.escape(isOncart[0].id)} and isdeleted=0;`
                const updatetotaltransaksi=await DbPROMselect(sql)

                senttosql={
                    totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                    totalmodal:updatetotaltransaksi[0].totalmodal
                }
                sql=`update transaksi set ${db.escape(senttosql)} where id=${isOncart[0].id}`
                const updatetransaksi=await DbPROMselect(sql)

            }

            let sendfront=await getcart(user_id)

            // Get All Transaksi parcel dan satuan.
            // Selanjutnya get sesuai parcel atau product id yg bukan 0
            // sql=`select * from transaksi
            // where status='oncart' and users_id=${db.escape(user_id)}`
            // const gettransaksi=await DbPROMselect(sql)
            
            // sql=`select td.transaksi_id as transaksi_id,products_id, nama, image, td.id as transaksidetail_id, harga as hargasatuan, 
            // td.hargatotal, td.qty from transaksi t
            // join transaksidetail td on td.transaksi_id=t.id
            // join products p on p.id=td.products_id
            // where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.parcel_id=0;`
            // const gettransaksidetailsatuan=await DbPROMselect(sql)

            // sql=`select td.transaksi_id as transaksi_id,td.parcel_id, nama, gambar, td.id as transaksidetail_id, harga as hargasatuan, 
            // td.hargatotal, td.qty, td.message from transaksi t
            // join transaksidetail td on td.transaksi_id=t.id
            // join parcel p on p.id=td.parcel_id
            // where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0;`
            // const gettransaksiparcel=await DbPROMselect(sql)

            // sql=`select td.transaksi_id as transaksi_id,td.id as transaksidetail_id,td.parcel_id as parcel_id, 
            // td.qty as qtyparcel,td.hargatotal, 
            // pa.nama as namaparcel, pa.harga as hargaparcel, tdhp.id as productinparcel_id,
            // tdhp.products_id as products_id, p.nama as namaproduct, tdhp.qty as qtyproduct, p.categoryproduct_id, cp.nama as category  from transaksi t
            // join transaksidetail td on td.transaksi_id=t.id
            // join transaksidetail_has_products tdhp on tdhp.transaksidetail_id=td.id
            // join products p on p.id=tdhp.products_id
            // join parcel pa on pa.id=td.parcel_id
            // join categoryproduct cp on cp.id=p.categoryproduct_id
            // where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0;  `
            // const gettransaksidetailparcel=await DbPROMselect(sql)
            
            // const getcart={
            //     transaksi:gettransaksi,
            //     transaksidetailsatuan:gettransaksidetailsatuan,
            //     transaksiparcel:gettransaksiparcel,
            //     transaksidetailparcel:gettransaksidetailparcel
            // }

            return res.send(sendfront)
        } catch (error) {
            console.log(error)
            return res.status(500).send({message:error.message})
        }
        

    },
    RemoveFromCart:async(req,res)=>{
        const {transaksi_id,transaksidetail_id,user_id}=req.body
        try {
            await DBTransaction()
            senttosql={
                isdeleted:1
            }
            let sql=`update transaksidetail set ${db.escape(senttosql)}
            where id=${db.escape(transaksidetail_id)}`
            const updatetransaksidetail=await DbPROMselect(sql)
            
            sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
            where transaksi_id=${db.escape(transaksi_id)} and isdeleted=0;`
            const updatetotaltransaksi=await DbPROMselect(sql)
            
            senttosql={
                totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                totalmodal:updatetotaltransaksi[0].totalmodal
            }
            
            sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(transaksi_id)}`
            const updatetransaksi=await DbPROMselect(sql)
            
            await DBCommit()


            let sendfront=await getcart(user_id)
            // Get All Transaksi parcel dan satuan.
            // Selanjutnya get sesuai parcel atau product id yg bukan 0
            // sql=`select * from transaksi
            // where status='oncart' and users_id=${db.escape(user_id)}`
            // const gettransaksi=await DbPROMselect(sql)
            
            // sql=`select td.transaksi_id as transaksi_id,products_id, nama, image, td.id as transaksidetail_id, harga as hargasatuan, 
            // td.hargatotal, td.qty from transaksi t
            // join transaksidetail td on td.transaksi_id=t.id
            // join products p on p.id=td.products_id
            // where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.parcel_id=0;`
            // const gettransaksidetailsatuan=await DbPROMselect(sql)
            
            // sql=`select td.transaksi_id as transaksi_id,td.parcel_id, nama, gambar, td.id as transaksidetail_id, harga as hargasatuan, 
            // td.hargatotal, td.qty, td.message from transaksi t
            // join transaksidetail td on td.transaksi_id=t.id
            // join parcel p on p.id=td.parcel_id
            // where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0;`
            // const gettransaksiparcel=await DbPROMselect(sql)

            // sql=`select td.transaksi_id as transaksi_id,td.id as transaksidetail_id,td.parcel_id as parcel_id, 
            // td.qty as qtyparcel,td.hargatotal, 
            // pa.nama as namaparcel, pa.harga as hargaparcel, tdhp.id as productinparcel_id,
            // tdhp.products_id as products_id, p.nama as namaproduct, tdhp.qty as qtyproduct, p.categoryproduct_id, cp.nama as category  from transaksi t
            // join transaksidetail td on td.transaksi_id=t.id
            // join transaksidetail_has_products tdhp on tdhp.transaksidetail_id=td.id
            // join products p on p.id=tdhp.products_id
            // join parcel pa on pa.id=td.parcel_id
            // join categoryproduct cp on cp.id=p.categoryproduct_id
            // where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0; `
            // const gettransaksidetailparcel=await DbPROMselect(sql)
            
            

            // const getcart={
            //     transaksi:gettransaksi,
            //     transaksidetailsatuan:gettransaksidetailsatuan,
            //     transaksiparcel:gettransaksiparcel,
            //     transaksidetailparcel:gettransaksidetailparcel
            // }

            return res.send(sendfront)
        } catch (error) {
            return res.status(500).send({message:error.message})
        }
    },
    Checkout:async(req,res)=>{
        console.log(req.body)
        const {transaksi_id,users_id,alamatPengiriman,catatanTambahan,namaPengirim,namaPenerima}=req.body
        try {
            let databack={
                status:"Belum dibayar",
                lastupdate:new Date(),
                catatantambahan:catatanTambahan,
                alamatpengiriman:alamatPengiriman,
                namaPenerima,
                namaPengirim
            }
            let sql=`update transaksi set ${db.escape(databack)} where id=${db.escape(transaksi_id)}`
            let sentdataback=await DbPROMselect(sql)

            console.log(sentdataback)

            let sendfront=await getcart(users_id)

            console.log(sendfront)

            res.send(sendfront)
        } catch (error) {
            console.log(error)
            return res.status(500).send({message:error.message})
        }
    },
    GetTransaksiList:async(req,res)=>{
        try {
            const {user_id}=req.body
            // let sql=`select * from transaksi
            // where status not in ('oncart') and users_id=${db.escape(user_id)}
            // order by id desc`
            // const gettransaksi=await DbPROMselect(sql)
            
            // sql=`select td.transaksi_id as transaksi_id,products_id, nama, image, td.id as transaksidetail_id, harga as hargasatuan, 
            // td.hargatotal, td.qty from transaksi t
            // join transaksidetail td on td.transaksi_id=t.id
            // join products p on p.id=td.products_id
            // where t.status not in ('oncart') and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.parcel_id=0
            // order by t.id desc;`
            // const gettransaksidetailsatuan=await DbPROMselect(sql)
            
            // sql=`select td.transaksi_id as transaksi_id,td.parcel_id, nama, gambar, td.id as transaksidetail_id, harga as hargasatuan, 
            // td.hargatotal, td.qty, td.message from transaksi t
            // join transaksidetail td on td.transaksi_id=t.id
            // join parcel p on p.id=td.parcel_id
            // where t.status not in ('oncart') and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0
            // order by t.id desc;`
            // const gettransaksiparcel=await DbPROMselect(sql)

            // sql=`select td.transaksi_id as transaksi_id,td.id as transaksidetail_id,td.parcel_id as parcel_id, 
            // td.qty as qtyparcel,td.hargatotal, 
            // pa.nama as namaparcel, pa.harga as hargaparcel, tdhp.id as productinparcel_id,
            // tdhp.products_id as products_id, p.nama as namaproduct, tdhp.qty as qtyproduct, p.categoryproduct_id, cp.nama as category  from transaksi t
            // join transaksidetail td on td.transaksi_id=t.id
            // join transaksidetail_has_products tdhp on tdhp.transaksidetail_id=td.id
            // join products p on p.id=tdhp.products_id
            // join parcel pa on pa.id=td.parcel_id
            // join categoryproduct cp on cp.id=p.categoryproduct_id
            // where t.status not in ('oncart') and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0
            // order by t.id desc; `
            // const gettransaksidetailparcel=await DbPROMselect(sql)

            // const getTransaksiList={
            //     transaksi:gettransaksi,
            //     transaksidetailsatuan:gettransaksidetailsatuan,
            //     transaksiparcel:gettransaksiparcel,
            //     transaksidetailparcel:gettransaksidetailparcel
            // }
            const getTransaksiList=await gettransaksilist(user_id)

            res.send(getTransaksiList)

        } catch (error) {
            console.log(error)
            return res.status(500).send({message:error.message})
        }
    },
    ConfirmBarangSampai:async(req,res)=>{
        try {
            const {users_id,transaksi_id}=req.body
            console.log(users_id,transaksi_id)
            let updatesql={
                status:"Pesanan Selesai"
            }
            let sql=`update transaksi set ${db.escape(updatesql)} where users_id=${db.escape(users_id)} and id=${db.escape(transaksi_id)}`
            const update=await DbPROMselect(sql)

            const getTransaksiList=await gettransaksilist(users_id)

            res.send(getTransaksiList)

        } catch (error) {
            console.log(error)
            return res.status(500).send({message:error.message})
        }
    }
}