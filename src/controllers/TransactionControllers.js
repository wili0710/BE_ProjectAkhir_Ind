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
    // transaksi ini hanya utk ujicoba, sifarnya sementara
    transaksi:async(req,res)=>{
        const {users_id,}=req.body
        let senttosql={
            users_id,
            lastupdate:new Date(),
            status:"oncart",
            totaltransaksi:239000
        }
        let sql=`insert into transaksi set ${db.escape(senttosql)}`
        const upload=await DbPROMselect(sql)
        console.log("upload transaksi berhasil")
        return res.send(true)
    },
    AddToCart:async(req,res)=>{
        const {user_id,products_id,parcel_id,qty}=req.body
        let sql= `select * from transaksi where status='oncart' and users_id=${db.escape(user_id)}`
        const getdatatransaksi=await DbPROMselect(sql)
        if (getdatatransaksi.length){
            sql=`select * from transaksidetail where products_id=${db.escape(products_id)} 
                and transaksi_id=${db.escape(getdatatransaksi[0].id)} and parcel_id=${db.escape(parcel_id)} and isdeleted=0`
            const getdatatransaksidetail=await DbPROMselect(sql)
            if(getdatatransaksidetail.length){
                let senttosql={
                    qty:parseInt(getdatatransaksidetail[0].qty)+parseInt(qty)
                }
                sql=`update transaksidetail set ${db.escape(senttosql)} where products_id=${db.escape(getdatatransaksidetail[0].products_id)}
                and transaksi_id=${db.escape(getdatatransaksidetail[0].transaksi_id)}`
                const updatedata=await DbPROMselect(sql)
                
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
                //Klo produk belum ada di cart
                let senttosql={
                    products_id:products_id,
                    parcel_id:parcel_id,
                    qty:qty
                }
                sql=`insert into transaksidetail set ${db.escape(senttosql)}`
                const addproductocart=await DbPROMselect(sql)
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
            // klo car masih kosong
            let senttosql={
                tanggal:new Date(),
                status:'oncart',
                users_id:user_id
            }
            sql=`insert into transaksi set ${db.escape(senttosql)}`
            const addcart=await DbPROMselect(sql)
            senttosql={
                products_id:products_id,
                transaksi_id:addcart.insertId,
                qty:qty
            }
            sql=`insert into transaksidetail set ${db.escape(senttosql)}`
            const addtotransaksidetail=await DbPROMselect(sql)
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
            where t.status='oncart' and t.users_id=1 and td.isdeleted=0;
            `
        const getcart=await DbPROMselect(sql)
        return res.send(getcart)
    },
}