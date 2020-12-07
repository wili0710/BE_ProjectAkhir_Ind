const {db}=require('../connections')
const {encrypt,transporter,OtpCreate, OtpConfirm,Link_Frontend}=require('../helpers')
const {createJWToken} = require('../helpers/jwt')
const fs =require('fs')
const handlebars=require('handlebars')
const { transaksi } = require('./TransactionControllers')

const DbPROMselect=(sql,imagePath=false)=>{
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
        sql=`select u.email,t.totaltransaksi,td.qty as jumlah, td.hargabeli,td.parcel_id,p.nama from transaksi t
            join transaksidetail td
            on t.id=td.transaksi_id
            join products p
            on td.products_id=p.id
            join users u 
            on t.users_id=u.id
            where t.id=${transaksi_id};`
        const datatransaction=await DbPROMselect(sql)
        const email=datatransaction[0].email

        console.log(datatransaction)
        console.log(email)
        console.log("sini")
        const htmlrender=fs.readFileSync('./src/emailtemplate/transactionreceipt.html','utf8')
            const template=handlebars.compile(htmlrender) //return function
            const htmlemail=template({transaksi_id:transaksi_id})

            transporter.sendMail({
                from:"Sorry<hearttoheart@gmail.com>",
                to:email,
                subject:'Transaction Receipt',
                html:htmlemail
            },(err)=>{
                if(err){
                    return res.status(500).send({message:err.message})
                }
                console.log("Transaction Receipt berhasil dikirim")
            })
        return res.send(true)
    },
    UploadPaymentTransfer:async(req,res)=>{
        const path='/buktipembayaran'
        const upload=uploader(path,'BUKTI').fields([{name:'bukti'}])
        upload(req,res,(err)=>{
            if(err){
                return res.status(500).json({message:'Upload Bukti Pembayaran Gagal!',error:err.message})
            }
            const {bukti} = req.files
            console.log(bukti)
            const imagePath=bukti?path+'/'+bukti[0].filename:null
            console.log(imagePath)
            const data = JSON.parse(req.body.data)

            const {users_id,transaksi_id}=req.body
            let senttosql={
                users_id,
                transaksi_id,
                image:imagePath,
                tanggaltransaksi:new Date(),
                status:"waiting admin"
            }
            let sql=`insert into userpayment set ${db.escape(senttosql)}`
            db.query(sql,(err)=>{
                if(err){
                    if(imagePath){
                        fs.unlinkSync('./public'+imagePath)
                    }
                    return res.status(500).send(err)
                }
            })
            return res.send(true)
        })

    },
    // GetPaymentInWaiting untuk get data payment yang status waiting admin
    GetPaymentInWaiting:async(req,res)=>{
        let {page}=req.query
        let sql
        console.log(page)
        if(page){
            sql=`select up.id as payment_id,transaksi_id,
            tanggaltransaksi,tglexp,image,totalpayment,t.totaltransaksi
            from userpayment up
            join transaksi t
            on up.transaksi_id=t.id
            where up.status="waiting admin"
            limit ${(page-1)*3},3
            ;`
        }else{
            sql=`select up.id as payment_id,transaksi_id,
            tanggaltransaksi,tglexp,image,totalpayment,t.totaltransaksi
            from userpayment up
            join transaksi t
            on up.transaksi_id=t.id
            where up.status="waiting admin"
            ;`
        }
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
   RejectPayment:async(req,res)=>{
       const {id}=req.params
       let senttosql={
           status:'rejected'
       }
       let sql=`update userpayment set ${db.escape(senttosql)} where id=${db.escape(id)}`
       const updatedata=await DbPROMselect(sql)
   }
    
}