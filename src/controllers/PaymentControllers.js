const {db}=require('../connections')
const {encrypt,transporter,OtpCreate, OtpConfirm,Link_Frontend, Link_Backend}=require('../helpers')
const {createJWToken} = require('../helpers/jwt')
const fs =require('fs')
const handlebars=require('handlebars')
const {uploader} = require('./../helpers/uploader')
const { get } = require('../helpers/mailers')
var numeral = require('numeral');
var createPDF = require('html-pdf');
const path= require('path')

const DBTransaction=()=>{
    return new Promise((resolve,reject)=>{
        db.beginTransaction((err)=>{
            if(err){
                reject(err)
            }else{
                console.log("dbtransaction")
                resolve()
            }
        })
    })
}
const DBCommit=()=>{
    return new Promise((resolve,reject)=>{
        db.commit((err)=>{
            if(err){
                console.log("ROLL BACK DB")
                return db.rollback(()=>{
                    reject(err)
                })
            } else{
                console.log("Save DB")
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
                status:"Pesanan Diproses"
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
            await DBCommit()
            return res.send(true)
        } catch (error) {
            return res.status(500).send({message:error.message})
        }
    },
    UploadPaymentTransfer:(req,res)=>{
        
        // await DBTransaction()
        
        const path='/buktipembayaran'
        const upload=uploader(path,'BUKTI').fields([{name:'bukti'}])
        upload(req,res,(err)=>{
            if(err){
                console.log(err)
                return res.status(500).json({message:'Upload Bukti Pembayaran Gagal!',error:err.message})
            }
            const {bukti} = req.files
            const imagePath=bukti?path+'/'+bukti[0].filename:null
            const data = JSON.parse(req.body.data)
            
            let senttosql={
                status:"Menunggu Konfirmasi"
            }
            const {transaksi_id,users_id}=data
            let sql=`update transaksi set ${db.escape(senttosql)} where id=${db.escape(transaksi_id)}`
            db.query(sql,(err,updateTransaksi)=>{
                if(err){
                    console.log(err)
                }
                console.log("transaksi ke update")
                sql=`select * from transaksi
                where id=${db.escape(transaksi_id)}`
                db.query(sql,(err,gettransaksi)=>{
                    if(err){
                        console.log(err)
                    }
                    senttosql={
                        users_id,
                        transaksi_id,
                        image:imagePath,
                        tanggaltransaksi:new Date(),
                        status:"Menunggu Konfirmasi",
                        totalpayment:gettransaksi[0].totaltransaksi
                    }
                    sql=`insert into userpayment set ${db.escape(senttosql)}`
                    db.query(sql,(err)=>{
                        if(err){
                            console.log(err)
                            if(imagePath){
                                fs.unlinkSync('./public'+imagePath)
                            }
                            return res.status(500).send(err)
                        }
                        console.log("Jalan sampai akhir")
                        return res.status(200).send({message:"Berhasil Upload Pembayaran"})
                    })
                })
            })
        })
    },
    // GetPaymentInWaiting untuk get data payment yang status waiting admin
    GetPaymentInWaiting:async(req,res)=>{
        let {page}=req.query
        let sql

        if(page){
            sql=`select up.id as payment_id,transaksi_id,
            tanggaltransaksi,tglexp,image,totalpayment,t.totaltransaksi
            from userpayment up
            join transaksi t
            on up.transaksi_id=t.id
            where up.status="Menunggu Konfirmasi"
            limit ${(page-1)*3},3
            ;`
        }else{
            sql=`select up.id as payment_id,transaksi_id,
            tanggaltransaksi,tglexp,image,totalpayment,t.totaltransaksi
            from userpayment up
            join transaksi t
            on up.transaksi_id=t.id
            where up.status="Menunggu Konfirmasi"
            ;`
        }
        const getData=await DbPROMselect(sql)

        console.log("get payment berhasil")
        return res.send(getData)
    },
    // Confirm Payment untuk ubah status Payment menjadi confirmed Sampai mengirim email sebagai Transaction Receipt
    ConfirmPayment:async(req,res)=>{
        const {payment_id,transaksi_id}=req.body

        try {
            
            await DBTransaction()
    
            let senttosql={status:"Pesanan Diproses"}
            let sql=`update userpayment set ${db.escape(senttosql)} where id=${payment_id}`
            const updatePayment=await DbPROMselect(sql)
    
            
            sentosql={status:"admin confirmed"}
            sql=`update transaksi set ${db.escape(senttosql)} where id=${transaksi_id}`
            const updateTransaksi=await DbPROMselect(sql)
    
            sql=`select u.email from transaksi t
                    join users u
                    on t.users_id=u.id
                    where t.id=${transaksi_id};`
            const email=await DbPROMselect(sql)
    
            sql=`select u.email,t.totaltransaksi,td.qty as jumlah, td.hargatotal,td.parcel_id,p.nama from transaksi t
                join transaksidetail td
                on t.id=td.transaksi_id
                join products p
                on td.products_id=p.id
                join users u 
                on t.users_id=u.id
                where t.id=6;`
            const datatransaction=await DbPROMselect(sql)
    
    
            const htmlrender=fs.readFileSync('./src/emailtemplate/transactionreceipt.html','utf8')
            const htmlpdfrender=fs.readFileSync('./src/emailtemplate/transactionreceiptpdf.html','utf8')
            const templatepdf=handlebars.compile(htmlpdfrender) //return function
            const template=handlebars.compile(htmlrender) //return function
    
    // ================================================================================================================================
    
            // Get All Transaksi parcel dan satuan.
            // Selanjutnya get sesuai parcel atau product id yg bukan 0
            sql=`select * from transaksi
            where id=${db.escape(transaksi_id)}`
            const gettransaksi=await DbPROMselect(sql)
            
            sql=`select td.transaksi_id as transaksi_id,products_id, nama, image, td.id as transaksidetail_id, harga as hargasatuan, 
            td.hargatotal, td.qty, p.id as products_id from transaksi t
            join transaksidetail td on td.transaksi_id=t.id
            join products p on p.id=td.products_id
            where t.id=${db.escape(transaksi_id)} and td.isdeleted=0 and td.parcel_id=0;`
            const gettransaksidetailsatuan=await DbPROMselect(sql)
    
            for(x=1;x<=gettransaksidetailsatuan.length;x++){
                sql=`select * from products where id=${db.escape(gettransaksidetailsatuan[x-1].products_id)}`
                let getProduct=await DbPROMselect(sql)
    
                console.log(gettransaksidetailsatuan[x-1].qty,getProduct[0].stok)
                senttosql={stok:getProduct[0].stok-gettransaksidetailsatuan[x-1].qty}
                console.log(senttosql)
                sql=`update products set ${db.escape(senttosql)} where id=${db.escape(gettransaksidetailsatuan[x-1].products_id)}`
                let updatestok=await DbPROMselect(sql)
            }
            
            
            sql=`select td.transaksi_id as transaksi_id,td.parcel_id, nama, gambar, td.id as transaksidetail_id, harga as hargasatuan, 
            td.hargatotal, td.qty, td.message from transaksi t
            join transaksidetail td on td.transaksi_id=t.id
            join parcel p on p.id=td.parcel_id
            where t.id=${db.escape(transaksi_id)} and td.isdeleted=0 and td.products_id=0;`
            const gettransaksiparcel=await DbPROMselect(sql)
    
            sql=`select td.transaksi_id as transaksi_id,td.id as transaksidetail_id,td.parcel_id as parcel_id, 
            td.qty as qtyparcel,td.hargatotal, 
            pa.nama as namaparcel, pa.harga as hargaparcel, tdhp.id as productinparcel_id,
            tdhp.products_id as products_id, p.nama as namaproduct, tdhp.qty as qtyproduct, p.categoryproduct_id, cp.nama as category  from transaksi t
            join transaksidetail td on td.transaksi_id=t.id
            join transaksidetail_has_products tdhp on tdhp.transaksidetail_id=td.id
            join products p on p.id=tdhp.products_id
            join parcel pa on pa.id=td.parcel_id
            join categoryproduct cp on cp.id=p.categoryproduct_id
            where t.id=${db.escape(transaksi_id)} and td.isdeleted=0 and td.products_id=0;`
            const gettransaksidetailparcel=await DbPROMselect(sql)
            
            for(x=1;x<=gettransaksidetailparcel.length;x++){
                sql=`select * from products where id=${db.escape(gettransaksidetailparcel[x-1].products_id)}`
                getProduct=await DbPROMselect(sql)
                
                senttosql={stok:getProduct[0].stok-gettransaksidetailparcel[x-1].qtyproduct}
                console.log(getProduct[0],gettransaksidetailparcel[x-1])
                sql=`update products set ${db.escape(senttosql)} where id=${db.escape(gettransaksidetailparcel[x-1].products_id)}`
                updatestok=await DbPROMselect(sql)
            }
    
            const getcart={
                transaksi:gettransaksi,
                transaksidetailsatuan:gettransaksidetailsatuan,
                transaksiparcel:gettransaksiparcel,
                transaksidetailparcel:gettransaksidetailparcel
            }
    
            const renderProductFromCart=handlebars.registerHelper("renderProductFromCart", function(cart) {
                let arr1= cart.transaksidetailsatuan.map((val,index)=>{
                    let totalsatuan=numeral(val.hargatotal).format('0,0')
                    let totalsatuanDot=totalsatuan.replace(/,/g,'.')
                    return (
                        `<div style="
                        border-bottom:5px solid #f3f4f5;
                        padding-top:10px;
                        padding-bottom:10px;
                    ">
                        <div style="
                            margin-right:10px;
                            display: inline-block;
                        ">
                            <img style="vertical-align: 0;" src="${Link_Backend}/${val.image}" width="50" height="50"/>
                        </div>
                        <div style="display: inline-block;margin-right: 100px;">
                            <span class="text" style="display: block;">${val.nama}</span>
                            <span class="text">Jumlah : ${val.qty}</span>
                        </div>
                        <div style="display: inline-block;float:right;text-align: right;">
                            <span class="text" style="display: block;">Total</span>  
                            <span style="
                                color:#fa5a1e;
                                font-weight:700;
                            ">
                                Rp ${totalsatuanDot}
                            </span>                        
                        </div>
                    </div>`
                    )
                })
                let arr2= cart.transaksiparcel.map((val,index)=>{
                    let totalparcel=numeral(val.hargatotal).format('0,0')
                    let totalparcelDot=totalparcel.replace(/,/g,'.')
    
                    let detailparcel=cart.transaksidetailparcel.filter((filtering)=>{
                        return filtering.transaksidetail_id===val.transaksidetail_id
                    })
                    let prerenderdetailparcel=detailparcel.map((detail,index)=>{
                        return(
                            `<div>
                            <div>
                                <span class="text">- ${detail.namaproduct} : ${detail.qtyproduct/detail.qtyparcel}</span>
                            </div>
                        </div>`
                        )
                    })

                    let readytoreplace=prerenderdetailparcel.join("\n")
                    let renderdetailparcel=readytoreplace.replace(/,/g,'')

                    return (
                        `<div style="
                        border-bottom:5px solid #f3f4f5;
                        padding-top:10px;
                        padding-bottom:10px;
                        height:fit-content;
                    ">
                        <div style="
                            margin-right:10px;
                            display: inline-block;
                            float:left;
                        ">
                            <img src="${val.gambar}" width="50" height="50"/>
                        </div>
                        <div style="display: inline-block;width: 250px;">
                            <span class="text" style="display: block;">${val.nama}</span>
                            <span class="text" style="display: block;">Jumlah : ${val.qty}</span>
                            <span class="text" style="display: block;">Isi Parcel</span>
                            <div>
                                ${renderdetailparcel}
                            </div>
                            <span class="text">Message Custom:</span>
                            <div style="border: 5px whitesmoke solid;padding: 5px; margin: auto;width: 250px;">
                                    <p style="word-wrap:break-word;">${val.message}</p>
                            </div>
                            
                        </div>
                        <div style="display: inline-block;float:right;text-align: right;">
                            <span class="text" style="display: block;">Total</span>
                            <span style="
                                color:#fa5a1e;
                                font-weight:700;
                            ">
                                Rp ${totalparcelDot}
                            </span>
                        </div>
                    </div>`
                    )
                })
    
                let sefinalarr2=arr2.join(" ")
                arr2=sefinalarr2.replace(/,/g,'')
    
                let sefinalarr1=arr1.join(" ")
                arr1=sefinalarr1.replace(/,/g,'')
    
                let prefinal=[arr2,arr1]
                let final=prefinal.join(" ")
                return final
            });
    
    // ================================================================================================================================
                
                
                const totaltransaksi=numeral(getcart.transaksi[0].totaltransaksi).format('0,0')
                const senttotaltransaksi=totaltransaksi.replace(/,/g,'.')
                const htmlemail=template({transaksi_id:transaksi_id,renderProductFromCart:renderProductFromCart,cart:getcart,totaltransaksi:senttotaltransaksi})
    
                const htmlpdf=templatepdf({
                    transaksi_id:transaksi_id,
                    renderProductFromCart:renderProductFromCart,
                    cart:getcart,totaltransaksi:senttotaltransaksi,
                    logo: 'file:///' + path.resolve(`./public`)+`/frontend/logoblue.png`,
                    footer: 'file:///' + path.resolve(`./public`)+`/frontend/footeremail.png`
                })

                let config={
                    // format: "A4",
                    orientation: "portrait"
                }
    
                createPDF.create(htmlpdf,config).toStream(function(err, stream){
                    transporter.sendMail({
                        from:"Sorry<hearttoheart@gmail.com>",
                        to:email[0].email,
                        subject:'Transaction Receipt',
                        html:htmlemail,
                        attachments: 
                        [
                            {
                                filename: 'image.png',
                                path: `${Link_Backend}/frontend/logoblue.png`,
                                cid: 'logoblue' //same cid value as in the html img src
                            },
                            {
                                filename: 'image2.png',
                                path: `${Link_Backend}/frontend/footeremail.png`,
                                cid: 'footer' //same cid value as in the html img src
                            },
                            {
                                filename: "Payment Receipt.pdf",
                                content:stream
                            }
                        ]
                    },(err)=>{
                        console.log("error create pdf")
                        console.log(err)
                        if(err){
                            return res.status(500).send({message:err.message})
                        }
                        console.log("Transaction Receipt berhasil dikirim")
                    })
    
                });
            await DBCommit()
            sql=`select up.id as payment_id,transaksi_id,
                    tanggaltransaksi,tglexp,image,totalpayment,t.totaltransaksi
                    from userpayment up
                    join transaksi t
                    on up.transaksi_id=t.id
                    where up.status="waiting admin"
                    ;`
            const getData=await DbPROMselect(sql)
            return res.send(getData)
        } catch (error) {
            console.log(error)
            db.rollback()
            sql=`select up.id as payment_id,transaksi_id,
                    tanggaltransaksi,tglexp,image,totalpayment,t.totaltransaksi
                    from userpayment up
                    join transaksi t
                    on up.transaksi_id=t.id
                    where up.status="waiting admin"
                    ;`
            const getData=await DbPROMselect(sql)
            console.log(error)
            return res.send(getData)
        }
    },
    RejectPayment:async(req,res)=>{
        const {id}=req.params
        let senttosql={
            status:'rejected'
        }
        let sql=`update userpayment set ${db.escape(senttosql)} where id=${db.escape(id)}`
        const updatedata=await DbPROMselect(sql)
    },
    
}