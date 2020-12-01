const {db}=require('../connections')
const {encrypt,transporter}=require('../helpers')
const {createJWToken} = require('../helpers/jwt')
const nodemailer = require('nodemailer')
const fs =require('fs')
const handlebars=require('handlebars')

module.exports={
    Login:(req,res)=>{
        const {email,password}=req.body
        let hashpassword = encrypt(password)
        
        let sql=`select * from users where email = ? and password = ?`
        // select * from users where (email = 'bayu darmawan' or nama = 'bayu darmawan') and password = 'bayu'; 
        // let sql = `select * from users where (email = ? or nama = ?) and password = ?`
        db.query(sql,[email,hashpassword],(err,datausers)=>{
            if(err)return res.status(500).send(err)
            if(!datausers.length){
                        // alert(`User tidak terdaftar`)
                        console.log('user tidak terdaftar, auth controller line 19')
                        return res.status(500).send({message:'user tidak terdaftar'})
                    }else {
                        console.log('masuk ke')
                        console.log(datausers[0], ' ini datauser line 22')
                        // return res.send({datauser:datausers[0]})
                        sql=`
                        select * from cart c
                         join users u on u.id = c.UserId
                         join products p on p.id = c.ProductId
                         where c.UserId = ?`
            
                         db.query(sql,[datausers[0].id], (err,cart)=>{
                             if(err){
                                 console.log(err)
                                 return res.status(500).send(err)
                             }
                             const token = createJWToken({id:datausers[0].id, username:datausers[0].username})
                             datausers[0].token = token
                             return res.send({datauser:datausers[0],cart})
                         })
                    }
        })
        console.log(hashpassword)
        // db.query(sql,[email,password],(err,datausers)=>{
        //     if(err){
        //         console.log(err)
        //         return res.status(500).send(err)
        //     }
        //     if(!datausers.length){
        //         // alert(`User tidak terdaftar`)
        //         console.log('user tidak terdaftar, auth controller line 19')
        //         return res.status(500).send({message:'user tidak terdaftar'})
        //     }else {
        //         console.log('masuk ke')
        //         console.log(datausers[0], ' ini datauser line 22')
        //         // return res.send({datauser:datausers[0]})
        //         sql=`
        //         select * from cart c
        //          join users u on u.id = c.UserId
        //          join products p on p.id = c.ProductId
        //          where c.UserId = ?`
    
        //          db.query(sql,[datausers[0].id], (err,cart)=>{
        //              if(err){
        //                  console.log(err)
        //                  return res.status(500).send(err)
        //              }
        //              const token = createJWToken({id:datausers[0].id, username:datausers[0].username})
        //              datausers[0].token = token
        //              return res.send({datauser:datausers[0],cart})
        //          })
        //     }
        // })
    }
}