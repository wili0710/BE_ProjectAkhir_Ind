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
                console.log()
                return res.send(true)
            })

        }catch(err){
            return res.status(500).send(err)
        }
    },
    ConfirmOtp: async (req,res)=>{
        let {otp,email}=req.body
        let sql=`select otp from users where email = ${db.escape(email)}`
        try{
            const otptoken=await DbPROMselect(sql)
            let istrue=OtpConfirm(otp,otptoken[0].otp)
            // console.log("jalan")
            if(istrue===true){
                return res.status(200).send(message='OTP Benar')
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
}