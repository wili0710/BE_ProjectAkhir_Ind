const encrypt =require('./encrypt')

module.exports={
    encrypt,
    uploader        : require('./uploader'),
    transporter     : require('./mailers'),
    OtpCreate       : require('./OtpCreate'),
    OtpConfirm      : require('./OtpConfirm'),
    // Link_Frontend   : "http://localhost:3000",
    Link_Frontend   : "http://h2h.wiliromario.com",
}