const encrypt =require('./encrypt')

module.exports={
    encrypt,
    uploader        : require('./uploader'),
    transporter     : require('./mailers'),
    OtpCreate       : require('./OtpCreate'),
    OtpConfirm      : require('./OtpConfirm'),
    getcart         : require('./getcart'),
    Link_Frontend   : "http://localhost:3000",
    Link_Backend    : "http://localhost:8000",
    // Link_Frontend   : "http://h2h.wiliromario.com",
    // Link_Backend    :  "https://hearttoheart-kel2.herokuapp.com"
}