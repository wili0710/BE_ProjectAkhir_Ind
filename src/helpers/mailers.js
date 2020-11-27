const nodemailer = require('nodemailer')
let transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:'darmawanbayu1@gmail.com',
        pass:'gbvjhdvucgsngrzd'
    },
    tls: {
        rejectUnauthorized:false
    }
})

module.exports=transporter