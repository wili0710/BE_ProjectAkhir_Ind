const {db}=require('../connections')
const {encrypt,transporter,OtpCreate, OtpConfirm,Link_Frontend}=require('../helpers')
const {createJWToken} = require('../helpers/jwt')
const fs =require('fs')
const handlebars=require('handlebars')

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
    }
}