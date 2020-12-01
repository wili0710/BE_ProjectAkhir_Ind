const {db}=require('../connections')
const {encrypt,transporter,OtpCreate, OtpConfirm,Link_Frontend}=require('../helpers')
// const OtpConfirm=require('../helpers/OtpConfirm')
const {createJWToken} = require('../helpers/jwt')
const nodemailer = require('nodemailer')
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
    
    //Table user di database yang non-null diubah menjadi hanya id dan email
    SentOtpRegister: async (req,res)=>{
        console.log("jalan")
        let {email}=req.body
        let otpnew=OtpCreate()
        let senttosql={
            otp:otpnew.otptoken
        }
        let sql=`select id,email from users where email = ${db.escape(email)}`
        try{
            const responduser=await DbPROMselect(sql)
            if(responduser.length){ 
                // Jika email sudah ada maka perbarui OTP
                sql=`update users set ${db.escape(senttosql)} where id=${db.escape(responduser[0].id)}`
                const userupdate=await DbPROMselect(sql)
            }else{
                senttosql={...senttosql,email}
                console.log("sent to sql")
                console.log(senttosql)
                sql=`insert into users set ${db.escape(senttosql)}`
                const userupdate=await DbPROMselect(sql)
            }
            const htmlrender=fs.readFileSync('./src/emailtemplate/verification.html','utf8')
            const template=handlebars.compile(htmlrender) //return function
            const link= `${Link_Frontend}/register`
            const otp=`${otpnew.otp}`
            const htmlemail=template({email:email,link:link,otp:otp})

            transporter.sendMail({
                from:"Development Phase<wiliromarioakukom@gmail.com>",
                to:email,
                subject:'OTP',
                html:htmlemail
            },(err)=>{
                if(err){
                    return res.status(500).send({message:err.message})
                }
                console.log("OTP Berhasil dikirim")
                return res.send(true)
            })

        }catch(err){
            return res.status(500).send(err)
        }
    },
    ConfirmOtp: async (req,res)=>{
        let {otp,email}=req.body
        let sql=`select otp from users where email = ${db.escape(email)}`
        // Ambil OTP Token dari Database
        try{
            const otptoken=await DbPROMselect(sql)
            let istrue=OtpConfirm(otp,otptoken[0].otp)
            // Menyamakan OTP dari User dan Database

            if(istrue===true){
                let senttosql={statusver:1,otp:""}
                // Update status verifikasi menjadi 1:Terverifikasi
                sql=`update users set ${db.escape(senttosql)} where email=${db.escape(email)}`
                const userupdate=await DbPROMselect(sql)
                sql=`select otp from users where email = ${db.escape(email)}`
                const getUser=await DbPROMselect(sql)
                return res.status(200).send({message:'OTP Benar',getUser})
            }else if(istrue===false){
                return res.status(200).send(message='OTP SALAH')
            }
            else{
                return res.status(200).send(message='OTP Expired')
            }
        }catch(err){
            return res.status(500).send(err)
        }
    },
    Register:async(req,res)=>{
        const {name,email,password,alamat,nomortelfon} = req.body
        if(password==null || nomortelfon==null){
            return res.status(500).send("Ada kesalahan")
        }
        let senttosql={
            name,
            password:encrypt(password),
            lastlogin:new Date(),
            alamat,
            nomortelfon
        }
        let sql=`update users set ${db.escape(senttosql)} where email=${db.escape(email)}`
        const userupdate=await DbPROMselect(sql)
        sql=`select id,name,email,roleid,alamat,nomortelfon from users where email=${db.escape(email)}`
        const getUser=await DbPROMselect(sql)
        const token=createJWToken({id:getUser[0].id,email:getUser[0].email})
        getUser[0].token=token
        
        return res.send(getUser[0])
    }
}