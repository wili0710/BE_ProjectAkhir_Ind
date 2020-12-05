const {db}=require('../connections')
const {encrypt,transporter,OtpCreate, OtpConfirm,Link_Frontend}=require('../helpers')
const {createJWToken} = require('../helpers/jwt')
const fs =require('fs')
const handlebars=require('handlebars')
const { parse } = require('path')

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
    AddToCart:async(req,res)=>{
        console.log("jalan")
        console.log(req.body)
        const {user_id,products_id,parcel_id,qty,productforparcel_id,qtyproductforparcel}=req.body
        let sql= `select * from transaksi where status='oncart' and users_id=${db.escape(user_id)}`
        const getdatatransaksi=await DbPROMselect(sql)
        if (getdatatransaksi.length){
            if(parcel_id==0){
                sql=`select * from transaksidetail where products_id=${db.escape(products_id)} 
                    and transaksi_id=${db.escape(getdatatransaksi[0].id)} and parcel_id=${db.escape(parcel_id)} and isdeleted=0`
                const getdatatransaksidetail=await DbPROMselect(sql)
                console.log(getdatatransaksidetail)
                if(getdatatransaksidetail.length){
                    let senttosql={
                        qty:parseInt(getdatatransaksidetail[0].qty)+parseInt(qty),
                        lastupdate:new Date()
                    }
                    sql=`update transaksidetail set ${db.escape(senttosql)} where products_id=${db.escape(getdatatransaksidetail[0].products_id)}
                    and transaksi_id=${db.escape(getdatatransaksidetail[0].transaksi_id)}`
                    const updatedata=await DbPROMselect(sql)

                    sql=`select td.qty*p.harga as totalharga from transaksidetail td
                        join products p on p.id=td.products_id
                        where td.id=${db.escape(getdatatransaksidetail[0].id)}`
                    const addhargatotal=await DbPROMselect(sql)
                    senttosql={
                        hargatotal:addhargatotal[0].totalharga
                    }
                    sql=`update transaksidetail set ${db.escape(senttosql)}
                        where id=${db.escape(getdatatransaksidetail[0].id)}`
                    const updatehargatotal=await DbPROMselect(sql)
                    
                    sql=`select * from transaksidetail td
                        join transaksi t on td.transaksi_id=t.id
                        join products p on td.products_id=p.id
                        join transaksidetail_has_products tdhp
                        on tdhp.transaksidetail_id=td.id
                        where t.status='oncart' and t.users_id=1 and td.isdeleted=0;
                        `
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

                    sql=`select * from transaksidetail td
                    join transaksi t on td.transaksi_id=t.id
                    join products p on td.products_id=p.id
                    join transaksidetail_has_products tdhp
                    on tdhp.transaksidetail_id=td.id
                    where t.status='oncart' and t.users_id=1 and td.isdeleted=0;
                    `
                    const datacart=await DbPROMselect(sql)
                    return res.send(datacart)
                }
            }else{

                sql=`select * from transaksidetail td
                    join transaksidetail_has_products tdhp
                    on tdhp.transaksidetail_id=td.id
                    where tdhp.products_id=("${db.escape(productforparcel_id)}")
                    and td.transaksi_id=${db.escape(getdatatransaksi[0].id)} and td.parcel_id=${db.escape(parcel_id)} and td.isdeleted=0`
                const getdatatransaksidetail=await DbPROMselect(sql)
                console.log(getdatatransaksidetail)
                if(getdatatransaksidetail.length){
                    sql=`select * from transaksidetail_has_products 
                    where transaksidetail_id=${db.escape(getdatatransaksidetail[0].id)}
                    and products_id=${db.escape(productforparcel_id)}`
                    const getqtyproductinparcel=await DbPROMselect(sql)
                    let senttosql={
                        qty:parseInt(getqtyproductinparcel[0].qty)+parseInt(qtyproductforparcel)
                    }
                    console.log("jalan")
                    console.log(senttosql)
                    sql=`update transaksidetail_has_products set ${db.escape(senttosql)} where products_id=${db.escape(productforparcel_id)}
                    and transaksidetail_id=${db.escape(getdatatransaksidetail[0].id)}`
                    const updatedata=await DbPROMselect(sql)
                    
                    sql=`select tdhp.qty*p.hargapokok as hargatotalpokok from transaksidetail_has_products tdhp
                        join products p on p.id=tdhp.products_id
                        where tdhp.transaksidetail_id=${db.escape(getdatatransaksidetail[0].id)} and tdhp.products_id=${productforparcel_id}`
                    const addhargatotal=await DbPROMselect(sql)
                    senttosql={
                        hargatotalpokok:addhargatotal[0].hargatotalpokok
                    }
                    sql=`update transaksidetail_has_products set ${db.escape(senttosql)}
                    where transaksidetail_id=${db.escape(getdatatransaksidetail[0].id)} and products_id=${productforparcel_id}`
                    const updatehargatotal=await DbPROMselect(sql)

                    sql=`select * from transaksidetail td
                        join transaksi t on td.transaksi_id=t.id
                        join products p on td.products_id=p.id
                        join transaksidetail_has_products tdhp
                        on tdhp.transaksidetail_id=td.id
                        where t.status='oncart' and t.users_id=1 and td.isdeleted=0;
                        `
                    const getcart=await DbPROMselect(sql)
                    return res.send(getcart)
                }else{
                    sql=`select * from parcel where id=${parcel_id}`
                    const getparcel=await DbPROMselect(sql)
                    let senttosql={
                        products_id:products_id,
                        parcel_id:parcel_id,
                        qty:1,
                        transaksi_id:getdatatransaksi[0].id,
                        lastupdate:new Date(),
                        hargatotal:getparcel[0].harga
                    }
                    sql=`insert into transaksidetail set ${db.escape(senttosql)}`
                    const addproductocart=await DbPROMselect(sql)

                    for(let x=1;x<=productforparcel_id.length;x++){
                        senttosql={
                            transaksidetail_id:addproductocart.insertId,
                            products_id:productforparcel_id[x-1],
                            qty:qtyproductforparcel[x-1],
                        }
                        sql=`insert into transaksidetail_has_products set ${db.escape(senttosql)}`
                        const addproductinparcel=await DbPROMselect(sql)
                    }

                    
                    console.log("sini")
                    for(let x=1;x<=productforparcel_id.length;x++){
                        sql=`select tdhp.qty*p.hargapokok as hargatotalpokok from transaksidetail_has_products tdhp
                            join products p on p.id=tdhp.products_id
                            where tdhp.transaksidetail_id=${db.escape(addproductocart.insertId)} and tdhp.products_id=${productforparcel_id[x-1]}`
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

                    sql=`select * from transaksidetail td
                    join transaksi t on td.transaksi_id=t.id
                    join products p on td.products_id=p.id
                    join transaksidetail_has_products tdhp
                    on tdhp.transaksidetail_id=td.id
                    where t.status='oncart' and t.users_id=1 and td.isdeleted=0;
                    `
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
            }else{
                sql=`select * from parcel where id=${parcel_id}`
                const getparcel=await DbPROMselect(sql)
                senttosql={
                    products_id:products_id,
                    transaksi_id:addcart.insertId,
                    parcel_id:parcel_id,
                    qty:qty,
                    lastupdate:new Date(),
                    hargatotal:getparcel[0].harga
                }
                sql=`insert into transaksidetail set ${db.escape(senttosql)}`
                const addtotransaksidetail=await DbPROMselect(sql)
                console.log(addtotransaksidetail)
                console.log(parcel_id)
                sql=`select * from products where id=${productforparcel_id}`
                const getproducts=await DbPROMselect(sql)
                console.log(getproducts)
                for(let x=1;x<=productforparcel_id.length;x++){
                    senttosql={
                        transaksidetail_id:addtotransaksidetail.insertId,
                        products_id:productforparcel_id,
                        qty:qtyproductforparcel,
                    }
                    sql=`insert into transaksidetail_has_products set ${db.escape(senttosql)}`
                    const addproductinparcel=await DbPROMselect(sql)
                }

                sql=`select tdhp.qty*p.hargapokok as hargatotalpokok from transaksidetail_has_products tdhp
                    join products p on p.id=tdhp.products_id
                    where tdhp.transaksidetail_id=${db.escape(addtotransaksidetail.insertId)} and tdhp.products_id=${productforparcel_id}`
                const addhargatotal=await DbPROMselect(sql)
                senttosql={
                    hargatotalpokok:addhargatotal[0].hargatotalpokok
                }
                sql=`update transaksidetail_has_products set ${db.escape(senttosql)}
                where transaksidetail_id=${db.escape(addtotransaksidetail.insertId)} and products_id=${productforparcel_id}`
                const updatehargatotal=await DbPROMselect(sql)

                console.log("berhasil add transaksi detail has product")
            }
            sql=`select * from transaksidetail td
                join transaksi t on td.transaksi_id=t.id
                join products p on td.products_id=p.id
                join transaksidetail_has_products tdhp
                on tdhp.transaksidetail_id=td.id
                where t.status='oncart' and t.users_id=1 and td.isdeleted=0;
                `
            const datacart=await DbPROMselect(sql)
            return res.send(datacart)
        }
    },
    GetCart:async(req,res)=>{
        const {user_id}=req.query
        sql=`select * from transaksidetail td
            join transaksi t on td.transaksi_id=t.id
            join products p on td.products_id=p.id
            join transaksidetail_has_products tdhp
            on tdhp.transaksidetail_id=td.id
            where t.status='oncart' and t.users_id=${db.escape(user_id)} and td.isdeleted=0;
            `
        const getcart=await DbPROMselect(sql)
        return res.send(getcart)
    },
}