const {db}=require('../connections')
const {encrypt,transporter,OtpCreate, OtpConfirm,Link_Frontend}=require('../helpers')
const {createJWToken} = require('../helpers/jwt')
const fs =require('fs')
const handlebars=require('handlebars')
const {uploader} = require('./../helpers/uploader')

const DBTransaction=()=>{
    return new Promise((resolve,reject)=>{
        db.beginTransaction((err)=>{
            if(err){
                reject(err)
            }else{
                resolve()
            }
        })
    })
}
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
        sql=`select * from transaksi
        where id=${db.escape(transaksi_id)}`
        const gettransaksi1=await DbPROMselect(sql)
        try {
            await DBTransaction()
            let senttosql={
                users_id,
                transaksi_id,
                image:"non-transfer",
                tanggaltransaksi:new Date(),
                status:"confirmed",
                totalpayment:gettransaksi1[0].totaltransaksi
            }
            let sql=`insert into userpayment set ${db.escape(senttosql)}`
            const upload=await DbPROMselect(sql)

            senttosql={
                status:"onsent"
            }
            sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(transaksi_id)}`
            const updateTransaksi=await DbPROMselect(sql)

            sql=`select * from transaksi
            where id=${transaksi_id}`
            const gettransaksi=await DbPROMselect(sql)
            
            sql=`select td.transaksi_id as transaksi_id,products_id, nama, image, td.id as transaksidetail_id, harga as hargasatuan, 
            td.hargatotal from transaksi t
            join transaksidetail td on td.transaksi_id=t.id
            join products p on p.id=td.products_id
            where t.status='oncart' and t.id=${transaksi_id} and td.isdeleted=0 and td.parcel_id=0;`
            const gettransaksidetailsatuan=await DbPROMselect(sql)

            sql=`select td.transaksi_id as transaksi_id,td.id as transaksidetail_id,td.parcel_id as parcel_id, 
            td.qty as qtyparcel,td.hargatotal, 
            pa.nama as namaparcel, pa.harga as hargaparcel, tdhp.id as productinparcel_id,
            tdhp.products_id as products_id, p.nama as namaproduct, tdhp.qty as qtyproduct  from transaksi t
            join transaksidetail td on td.transaksi_id=t.id
            join transaksidetail_has_products tdhp on tdhp.transaksidetail_id=td.id
            join products p on p.id=tdhp.products_id
            join parcel pa on pa.id=td.parcel_id
            where t.status='oncart' and t.id=${transaksi_id} and td.isdeleted=0 and td.products_id=0; `
            const gettransaksidetailparcel=await DbPROMselect(sql)
            
            sql=`select email from users where id=${users_id}`
            const getemail=await DbPROMselect(sql)

            const email=getemail[0].email
            const getcart={
                transaksi:gettransaksi,
                transaksidetailsatuan:gettransaksidetailsatuan,
                transaksidetailparcel:gettransaksidetailparcel
            }

            console.log("upload payment non transfer berhasil")

    
            console.log(getcart)
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
            db.commit((err)=>{
                if(err){
                    return db.rollback(()=>{
                        res.status(500).send(err)
                    })
                } 
            })
            return res.send(true)
        } catch (error) {
            return res.status(500).send({message:error.message})
        }
    },
    UploadPaymentTransfer:async(req,res)=>{
        const {users_id,transaksi_id}=req.body
        sql=`select * from transaksi
        where id=${db.escape(transaksi_id)}`
        const gettransaksi=await DbPROMselect(sql)

        await DBTransaction()
        senttosql={
            status:"waiting admin"
        }
        sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(transaksi_id)}`
        const updateTransaksi=await DbPROMselect(sql)

        const path='/buktipembayaran'
        const upload=uploader(path,'BUKTI').fields([{name:'bukti'}])
        upload(req,res,(err)=>{
            if(err){
                return res.status(500).json({message:'Upload Bukti Pembayaran Gagal!',error:err.message})
            }
            const {bukti} = req.files
            // console.log(bukti)
            const imagePath=bukti?path+'/'+bukti[0].filename:null
            // console.log(imagePath)
            const data = JSON.parse(req.body.data)

            let senttosql={
                users_id,
                transaksi_id,
                image:imagePath,
                tanggaltransaksi:new Date(),
                status:"waiting admin",
                totalpayment:gettransaksi[0].totaltransaksi
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
            db.commit((err)=>{
                if(err){
                    return db.rollback(()=>{
                        res.status(500).send(err)
                    })
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