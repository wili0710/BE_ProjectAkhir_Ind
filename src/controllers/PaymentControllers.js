const {db}=require('../connections')
const {encrypt,transporter,OtpCreate, OtpConfirm,Link_Frontend}=require('../helpers')
const {createJWToken} = require('../helpers/jwt')
const fs =require('fs')
const handlebars=require('handlebars')
const { transaksi } = require('./TransactionControllers')

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
    // Upload Payment untuk yang bukan transfer dan langsung status confirmed
    UploadPayment:async(req,res)=>{
        const {users_id,transaksi_id}=req.body
        let senttosql={
            users_id,
            transaksi_id,
            image:"non-transfer",
            tanggaltransaksi:new Date(),
            status:"confirmed"
        }
        let sql=`insert into userpayment set ${db.escape(senttosql)}`
        const upload=await DbPROMselect(sql)
        console.log("upload payment non transfer berhasil")
        return res.send(true)
    },
    UploadPaymentTransfer:async(req,res)=>{
        const {users_id,transaksi_id,image}=req.body
        let senttosql={
            users_id,
            transaksi_id,
            image,
            tanggaltransaksi:new Date(),
            status:"waiting admin"
        }
        let sql=`insert into userpayment set ${db.escape(senttosql)}`
        const upload=await DbPROMselect(sql)
        return res.send(true)
    },
    // GetPaymentInWaiting untuk get data payment yang status waiting admin
    GetPaymentInWaiting:async(req,res)=>{
        let sql=`select up.id as payment_id,transaksi_id,
                tanggaltransaksi,tglexp,image,totalpayment,t.totaltransaksi
                from userpayment up
                join transaksi t
                on up.transaksi_id=t.id
                where up.status="waiting admin"
                ;`
        const getData=await DbPROMselect(sql)
        console.log(getData)
        console.log("get payment berhasil")
        return res.send(getData)
    },
    // Confirm Payment untuk ubah status Payment menjadi confirmed Sampai mengirim email sebagai Transaction Receipt
    ConfirmPayment:async(req,res)=>{
        const {payment_id,transaksi_id}=req.body
        console.log(req.body)
        let senttosql={status:"confirmed"}
        let sql=`update userpayment set ${db.escape(senttosql)} where id=${payment_id}`
        const updatePayment=await DbPROMselect(sql)
        console.log("update payment")
        
        sentosql={status:"admin confirmed"}
        sql=`update transaksi set ${db.escape(senttosql)} where id=${transaksi_id}`
        const updateTransaksi=await DbPROMselect(sql)

        sql=`select u.email from transaksi t
                join users u
                on t.users_id=u.id
                where t.id=${transaksi_id};`
        const email=await DbPROMselect(sql)

        sql=`select u.email,t.totaltransaksi,td.qty as jumlah, td.hargabeli,td.parcel_id,p.nama from transaksi t
            join transaksidetail td
            on t.id=td.transaksi_id
            join products p
            on td.products_id=p.id
            join users u 
            on t.users_id=u.id
            where t.id=6;`
        const datatransaction=await DbPROMselect(sql)

        console.log(datatransaction)
        console.log(email[0].email)
        console.log("sini")
        const htmlrender=fs.readFileSync('./src/emailtemplate/transactionreceipt.html','utf8')
            const template=handlebars.compile(htmlrender) //return function
            const htmlemail=template({transaksi_id:transaksi_id})

            transporter.sendMail({
                from:"Sorry<hearttoheart@gmail.com>",
                to:email[0].email,
                subject:'Transaction Receipt',
                html:htmlemail
            },(err)=>{
                if(err){
                    return res.status(500).send({message:err.message})
                }
                console.log("Transaction Receipt berhasil dikirim")
            })

        sql=`select up.id as payment_id,transaksi_id,
                tanggaltransaksi,tglexp,image,totalpayment,t.totaltransaksi
                from userpayment up
                join transaksi t
                on up.transaksi_id=t.id
                where up.status="waiting admin"
                ;`
        const getData=await DbPROMselect(sql)
        console.log(getData)
        return res.send(getData)
    },
   
    
}