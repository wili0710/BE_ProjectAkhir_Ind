const {db}=require('../connections')
const {encrypt,transporter,OtpCreate, OtpConfirm,Link_Frontend}=require('../helpers')
const {createJWToken} = require('../helpers/jwt')
const fs =require('fs')
const handlebars=require('handlebars')
const { parse, resolve } = require('path')

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
    // AddToCart tidak menambah QTY tetapi mengupdate QTY
    AddToCart:async(req,res)=>{
        console.log("jalan")
        console.log(req.body)
        const {user_id,products_id,parcel_id,qty,productforparcel_id,qtyproductforparcel,transaksidetail_id}=req.body
        let sql= `select * from transaksi where status='oncart' and users_id=${db.escape(user_id)}`
        try {
            await DBTransaction()
            const getdatatransaksi=await DbPROMselect(sql)
    
            if (getdatatransaksi.length){
                if(parcel_id==0){
                    sql=`select * from transaksidetail where products_id=${db.escape(products_id)} 
                        and transaksi_id=${db.escape(getdatatransaksi[0].id)} and parcel_id=${db.escape(parcel_id)} and isdeleted=0`
                    const getdatatransaksidetail=await DbPROMselect(sql)
                    console.log(getdatatransaksidetail)
                    if(getdatatransaksidetail.length){
                        let senttosql={
                            qty:parseInt(qty),
                            lastupdate:new Date()
                        }
                        sql=`update transaksidetail set ${db.escape(senttosql)} 
                        where products_id=${db.escape(getdatatransaksidetail[0].products_id)}
                        and transaksi_id=${db.escape(getdatatransaksidetail[0].transaksi_id)}`
                        const updatedata=await DbPROMselect(sql)
    
                        sql=`select td.qty*p.harga as totalharga from transaksidetail td
                            join products p on p.id=td.products_id
                            where td.id=${db.escape(getdatatransaksidetail[0].id)}`
                        const addhargatotal=await DbPROMselect(sql)
                        senttosql={
                            hargatotal:addhargatotal[0].totalharga
                        }
                        sql=`update transaksidetail set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksidetail[0].id)}`
                        const updatetransaksidetail=await DbPROMselect(sql)

                        sql=`select sum(hargatotal) as totaltransaksi from transaksidetail
                        where transaksi_id=${db.escape(getdatatransaksi[0].id)} and isdeleted=0;`
                        const updatetotaltransaksi=await DbPROMselect(sql)

                        senttosql={totaltransaksi:updatetotaltransaksi[0].totaltransaksi}
                        sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksi[0].id)}`
                        const updatetransaksi=await DbPROMselect(sql)

                        db.commit((err)=>{
                            if(err){
                                return db.rollback(()=>{
                                    res.status(500).send(err)
                                })
                            } 
                        })
                        // Get All Transaksi parcel dan satuan.
                        // Selanjutnya get sesuai parcel atau product id yg bukan 0
                        sql=`select * from transaksidetail td
                        join transaksi t on td.transaksi_id=t.id
                        where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0;`
                        const getcart=await DbPROMselect(sql)
                        return res.send(getcart)
    
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
    
                        sql=`select td.qty*p.harga as totalharga from transaksidetail td
                            join products p on p.id=td.products_id
                            where td.id=${db.escape(addproductocart.insertId)}`
                        const addhargatotal=await DbPROMselect(sql)
                        senttosql={
                            hargatotal:addhargatotal[0].totalharga
                        }
                        sql=`update transaksidetail set ${db.escape(senttosql)}
                            where id=${db.escape(addproductocart.insertId)}`
                        const updatehargatotal=await DbPROMselect(sql)
    
                        sql=`select sum(hargatotal) as totaltransaksi from transaksidetail
                        where transaksi_id=${db.escape(getdatatransaksi[0].id)} and isdeleted=0;`
                        const updatetotaltransaksi=await DbPROMselect(sql)

                        senttosql={totaltransaksi:updatetotaltransaksi[0].totaltransaksi}
                        sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksi[0].id)}`
                        const updatetransaksi=await DbPROMselect(sql)

                        db.commit((err)=>{
                            if(err){
                                return db.rollback(()=>{
                                    res.status(500).send(err)
                                })
                            } 
                        })
    
                        // Get All Transaksi parcel dan satuan.
                        // Selanjutnya get sesuai parcel atau product id yg bukan 0
                        sql=`select * from transaksidetail td
                        join transaksi t on td.transaksi_id=t.id
                        where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0;`
                        const datacart=await DbPROMselect(sql)
                        return res.send(datacart)
                    }
                }else{
                    sql=`select td.id from transaksidetail td
                        join transaksidetail_has_products tdhp
                        on tdhp.transaksidetail_id=td.id
                        where tdhp.products_id in ("${db.escape(productforparcel_id)}") and td.id=${db.escape(transaksidetail_id)}
                        and td.transaksi_id=${db.escape(getdatatransaksi[0].id)} and td.parcel_id=${db.escape(parcel_id)} and td.isdeleted=0`
                    const getdatatransaksidetail=await DbPROMselect(sql)
                    console.log(getdatatransaksidetail)
                    
                    if(getdatatransaksidetail.length){    
                        sql=`select * from parcel where id=${parcel_id}`
                        const getparcel=await DbPROMselect(sql)                
                        senttosql={
                            qty:parseInt(qty),
                            hargatotal:getparcel[0].harga*qty
                        }
                        sql=`update transaksidetail set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksidetail[0].id)}`
                        const updatetransaksidetail=await DbPROMselect(sql)
                        sql=`select * from transaksidetail_has_products 
                        where transaksidetail_id=${getdatatransaksidetail[0].id}`
                        const gettdid=await DbPROMselect(sql)
                        for(let x=1;x<=productforparcel_id.length;x++){
                            console.log(gettdid[x-1].id)
                            senttosql={
                                qty:parseInt(qtyproductforparcel[x-1])*parseInt(qty),
                                products_id:productforparcel_id[x-1]
                            }
                            sql=`update transaksidetail_has_products set ${db.escape(senttosql)} 
                            where transaksidetail_id=${db.escape(getdatatransaksidetail[0].id)}
                            and id=${db.escape(gettdid[x-1].id)}`
                            const addproductinparcel=await DbPROMselect(sql)
                            console.log(addproductinparcel)
                            console.log(productforparcel_id[x-1])
                        }
                        console.log("sini")
                        console.log(getdatatransaksidetail[0])
                        for(let x=1;x<=productforparcel_id.length;x++){
                            sql=`select tdhp.qty*p.hargapokok as hargatotalpokok from transaksidetail_has_products tdhp
                                join products p on p.id=tdhp.products_id
                                where tdhp.transaksidetail_id=${db.escape(getdatatransaksidetail[0].id)} 
                                and tdhp.products_id=${productforparcel_id[x-1]}`
                            const addhargatotal=await DbPROMselect(sql)
                            // console.log("sajaaaaa")
                            console.log(addhargatotal[0].hargatotalpokok)
                            senttosql={
                                hargatotalpokok:addhargatotal[0].hargatotalpokok
                            }
                            
                            sql=`update transaksidetail_has_products set ${db.escape(senttosql)}
                            where transaksidetail_id=${db.escape(getdatatransaksidetail[0].id)} and products_id=${productforparcel_id[x-1]}`
                            const updatehargatotal=await DbPROMselect(sql)
                            // console.log(updatehargatotal)
                        }
                        sql=`select sum(hargatotal) as totaltransaksi from transaksidetail
                        where transaksi_id=${db.escape(getdatatransaksi[0].id)} and isdeleted=0;`
                        const updatetotaltransaksi=await DbPROMselect(sql)

                        senttosql={totaltransaksi:updatetotaltransaksi[0].totaltransaksi}
                        sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksi[0].id)}`
                        const updatetransaksi=await DbPROMselect(sql)

                        db.commit((err)=>{
                            if(err){
                                return db.rollback(()=>{
                                    res.status(500).send(err)
                                })
                            } 
                        })
    
                        // Get All Transaksi parcel dan satuan.
                        // Selanjutnya get sesuai parcel atau product id yg bukan 0
                        sql=`select * from transaksidetail td
                        join transaksi t on td.transaksi_id=t.id
                        where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0;`
                        const getcart=await DbPROMselect(sql)
                        return res.send(getcart)
                    }else{
                        sql=`select * from parcel where id=${parcel_id}`
                        const getparcel=await DbPROMselect(sql)
                        let senttosql={
                            products_id:products_id,
                            parcel_id:parcel_id,
                            qty:qty,
                            transaksi_id:getdatatransaksi[0].id,
                            lastupdate:new Date(),
                            hargatotal:getparcel[0].harga*qty
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
    
                        console.log("sini")
                        for(let x=1;x<=productforparcel_id.length;x++){
                            sql=`select tdhp.qty*p.hargapokok as hargatotalpokok from transaksidetail_has_products tdhp
                                join products p on p.id=tdhp.products_id
                                where tdhp.transaksidetail_id=${db.escape(addproductocart.insertId)} 
                                and tdhp.products_id=${productforparcel_id[x-1]}`
                            const addhargatotal=await DbPROMselect(sql)
                            console.log("saja")
                            console.log(addhargatotal)
                            senttosql={
                                hargatotalpokok:addhargatotal[0].hargatotalpokok
                            }
                            sql=`update transaksidetail_has_products set ${db.escape(senttosql)}
                            where transaksidetail_id=${db.escape(addproductocart.insertId)} and products_id=${productforparcel_id[x-1]}`
                            const updatehargatotal=await DbPROMselect(sql)
                        }
                        
                        sql=`select sum(hargatotal) as totaltransaksi from transaksidetail
                        where transaksi_id=${db.escape(getdatatransaksi[0].id)} and isdeleted=0;`
                        const updatetotaltransaksi=await DbPROMselect(sql)

                        senttosql={totaltransaksi:updatetotaltransaksi[0].totaltransaksi}
                        sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(getdatatransaksi[0].id)}`
                        const updatetransaksi=await DbPROMselect(sql)

                        db.commit((err)=>{
                            if(err){
                                return db.rollback(()=>{
                                    res.status(500).send(err)
                                })
                            } 
                        })
    
                        // Get All Transaksi parcel dan satuan.
                        // Selanjutnya get sesuai parcel atau product id yg bukan 0
                        sql=`select * from transaksidetail td
                        join transaksi t on td.transaksi_id=t.id
                        where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0;`
                        const datacart=await DbPROMselect(sql)
                        return res.send(datacart)
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
                console.log(addcart)
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
                    sql=`select td.qty*p.harga as totalharga from transaksidetail td
                        join products p on p.id=td.products_id
                        where td.id=${db.escape(addtotransaksidetail.insertId)}`
                    const addhargatotal=await DbPROMselect(sql)
                    console.log(addhargatotal)
                    senttosql={
                        hargatotal:addhargatotal[0].totalharga
                    }
                    sql=`update transaksidetail set ${db.escape(senttosql)}
                        where id=${db.escape(addtotransaksidetail.insertId)}`
                    const updatehargatotal=await DbPROMselect(sql)
                    console.log(updatehargatotal)
                    console.log("jalan")

                    sql=`select sum(hargatotal) as totaltransaksi from transaksidetail
                    where transaksi_id=${db.escape(addcart.insertId)} and isdeleted=0;`
                    const updatetotaltransaksi=await DbPROMselect(sql)

                    senttosql={totaltransaksi:updatetotaltransaksi[0].totaltransaksi}
                    sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(addcart.insertId)}`
                    const updatetransaksi=await DbPROMselect(sql)

                    

                }else{
                    sql=`select * from parcel where id=${parcel_id}`
                    const getparcel=await DbPROMselect(sql)
                    senttosql={
                        products_id:products_id,
                        transaksi_id:addcart.insertId,
                        parcel_id:parcel_id,
                        qty:qty,
                        lastupdate:new Date(),
                        hargatotal:getparcel[0].harga*qty
                    }
                    sql=`insert into transaksidetail set ${db.escape(senttosql)}`
                    const addtotransaksidetail=await DbPROMselect(sql)
                    console.log(addtotransaksidetail)
                    console.log(parcel_id)
                    
                    for(let x=1;x<=productforparcel_id.length;x++){
                        senttosql={
                            transaksidetail_id:addtotransaksidetail.insertId,
                            products_id:productforparcel_id[x-1],
                            qty:qtyproductforparcel[x-1]*qty,
                        }
                        sql=`insert into transaksidetail_has_products set ${db.escape(senttosql)}`
                        const addproductinparcel=await DbPROMselect(sql)
                    }
    
                    
                    console.log("sini")
                    for(let x=1;x<=productforparcel_id.length;x++){
                        sql=`select tdhp.qty*p.hargapokok as hargatotalpokok from transaksidetail_has_products tdhp
                            join products p on p.id=tdhp.products_id
                            where tdhp.transaksidetail_id=${db.escape(addtotransaksidetail.insertId)} 
                            and tdhp.products_id=${productforparcel_id[x-1]}`
                        const addhargatotal=await DbPROMselect(sql)
                        console.log("saja")
                        console.log(addhargatotal)
                        senttosql={
                            hargatotalpokok:addhargatotal[0].hargatotalpokok
                        }
                        sql=`update transaksidetail_has_products set ${db.escape(senttosql)}
                        where transaksidetail_id=${db.escape(addtotransaksidetail.insertId)} and products_id=${productforparcel_id[x-1]}`
                        const updatehargatotal=await DbPROMselect(sql)
                    }
                    sql=`select sum(hargatotal) as totaltransaksi from transaksidetail
                    where transaksi_id=${db.escape(addcart.insertId)} and isdeleted=0;`
                    const updatetotaltransaksi=await DbPROMselect(sql)

                    senttosql={totaltransaksi:updatetotaltransaksi[0].totaltransaksi}
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
                

                // Get All Transaksi parcel dan satuan.
                // Selanjutnya get sesuai parcel atau product id yg bukan 0
                sql=`select * from transaksidetail td
                join transaksi t on td.transaksi_id=t.id
                where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0;`
                const datacart=await DbPROMselect(sql)
                return res.send(datacart)
            }
        } catch (error) {
            return res.status(500).send({message:error.message})
        }
    },
    GetCart:async(req,res)=>{
        const {user_id}=req.query
        try {
            sql=`select sum(hargatotal) as totaltransaksi from transaksidetail td
            join transaksi t on t.id=td.transaksi_id
            where t.users_id=${user_id} and isdeleted=0 and status="oncart";`
            const updatetotaltransaksi=await DbPROMselect(sql)
            console.log(updatetotaltransaksi)
            
            senttosql={totaltransaksi:updatetotaltransaksi[0].totaltransaksi}
            sql=`update transaksi set ${db.escape(senttosql)} where users_id=${user_id}`
            const updatetransaksi=await DbPROMselect(sql)

            // Get All Transaksi parcel dan satuan.
            // Selanjutnya get sesuai parcel atau product id yg bukan 0
            sql=`select * from transaksi
            where status='oncart' and users_id=${db.escape(user_id)}`
            const gettransaksi=await DbPROMselect(sql)
            
            sql=`select td.transaksi_id as transaksi_id,products_id, nama, image, td.id as transaksidetail_id, harga as hargasatuan, 
            td.hargatotal from transaksi t
            join transaksidetail td on td.transaksi_id=t.id
            join products p on p.id=td.products_id
            where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.parcel_id=0;`
            const gettransaksidetailsatuan=await DbPROMselect(sql)

            sql=`select td.transaksi_id as transaksi_id,td.id as transaksidetail_id,td.parcel_id as parcel_id, 
            td.qty as qtyparcel,td.hargatotal, 
            pa.nama as namaparcel, pa.harga as hargaparcel, tdhp.id as productinparcel_id,
            tdhp.products_id as products_id, p.nama as namaproduct, tdhp.qty as qtyproduct  from transaksi t
            join transaksidetail td on td.transaksi_id=t.id
            join transaksidetail_has_products tdhp on tdhp.transaksidetail_id=td.id
            join products p on p.id=tdhp.products_id
            join parcel pa on pa.id=td.parcel_id
            where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0 and td.products_id=0; `
            const gettransaksidetailparcel=await DbPROMselect(sql)
            
            const getcart={
                transaksi:gettransaksi,
                transaksidetailsatuan:gettransaksidetailsatuan,
                transaksidetailparcel:gettransaksidetailparcel
            }
            return res.send(getcart)
        } catch (error) {
            return res.status(500).send({message:error.message})
        }
        

    },
    RemoveFromCart:async(req,res)=>{
        const {transaksidetail_id}=req.body
        try {
            senttosql={
                isdeleted:1
            }
            let sql=`update transaksidetail set ${db.escape(senttosql)}
            where id=${db.escape(transaksidetail_id)}`
            const updatetransaksidetail=await DbPROMselect(sql)
            return res.send("Success Remove From Cart")
        } catch (error) {
            return res.status(500).send({message:error.message})
        }
    },
}