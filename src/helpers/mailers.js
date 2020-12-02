const nodemailer = require('nodemailer')
let transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:'wiliromarioakukom@gmail.com',
        pass:'bmlzvaibgswapkdn'
    },
    tls: {
        rejectUnauthorized:false
    }
})

module.exports=transporter