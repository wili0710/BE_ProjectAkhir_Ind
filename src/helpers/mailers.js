const nodemailer = require('nodemailer')
let transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:'wiliromarioakukom@gmail.com',
        pass:'xvztiqnzxwlbhtwm'
    },
    tls: {
        rejectUnauthorized:false
    }
})

module.exports=transporter