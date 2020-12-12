const {db}=require('../connections')
const {encrypt,transporter,OtpCreate, OtpConfirm,Link_Frontend}=require('../helpers')
const {createJWToken} = require('../helpers/jwt')
const fs =require('fs')
const handlebars=require('handlebars')
const moment = require('moment');

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
    newKeepLogin:async(req,res)=>{
        try{
            const{id}= req.body
            let sql=`select * from users where id =${db.escape(id)}`
            const getUser = await DbPROMselect(sql)


             // check total transaksi
            sql=`select * from transaksi where users_id=${getUser[0].id} and status="oncart"`
            const isOncart=await DbPROMselect(sql)
            if(isOncart.length){
                sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
                where transaksi_id=${db.escape(isOncart[0].id)} and isdeleted=0;`
                const updatetotaltransaksi=await DbPROMselect(sql)
                console.log(updatetotaltransaksi[0].transaksi_id)
                senttosql={
                    totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                    totalmodal:updatetotaltransaksi[0].totalmodal
                }
                sql=`update transaksi set ${db.escape(senttosql)} where id=${isOncart[0].id}`
                const updatetransaksi=await DbPROMselect(sql)
                console.log(updatetransaksi)

            }
 
             // Get All Transaksi parcel dan satuan.
             // Selanjutnya get sesuai parcel atau product id yg bukan 0
             sql=`select * from transaksi
             where status='oncart' and users_id=${db.escape(getUser[0].id)}`
             const gettransaksi=await DbPROMselect(sql)
 
             sql=`select td.transaksi_id as transaksi_id,products_id, nama, image, td.id as transaksidetail_id, harga as hargasatuan, 
             td.hargatotal, td.qty from transaksi t
             join transaksidetail td on td.transaksi_id=t.id
             join products p on p.id=td.products_id
             where t.status='oncart' and t.users_id=${db.escape(getUser[0].id)} and td.isdeleted=0 and td.parcel_id=0;`
             const gettransaksidetailsatuan=await DbPROMselect(sql)
 
             sql=`select td.transaksi_id as transaksi_id,products_id, nama, gambar, td.id as transaksidetail_id, harga as hargasatuan, 
             td.hargatotal, td.qty, td.message from transaksi t
             join transaksidetail td on td.transaksi_id=t.id
             join parcel p on p.id=td.parcel_id
             where t.status='oncart' and t.users_id=${db.escape(getUser[0].id)} and td.isdeleted=0 and td.products_id=0;`
             const gettransaksiparcel=await DbPROMselect(sql)
 
             sql=`select td.transaksi_id as transaksi_id,td.id as transaksidetail_id,td.parcel_id as parcel_id, 
             td.qty as qtyparcel,td.hargatotal, 
             pa.nama as namaparcel, pa.harga as hargaparcel, tdhp.id as productinparcel_id,
             tdhp.products_id as products_id, p.nama as namaproduct, tdhp.qty as qtyproduct  from transaksi t
             join transaksidetail td on td.transaksi_id=t.id
             join transaksidetail_has_products tdhp on tdhp.transaksidetail_id=td.id
             join products p on p.id=tdhp.products_id
             join parcel pa on pa.id=td.parcel_id
             where t.status='oncart' and t.users_id=${db.escape(getUser[0].id)} and td.isdeleted=0 and td.products_id=0; `
             const gettransaksidetailparcel=await DbPROMselect(sql)
 
             // const getcart={
             //     user:getUser,
             //     transaksi:gettransaksi,
             //     transaksidetailsatuan:gettransaksidetailsatuan,
             //     transaksiparcel:gettransaksiparcel,
             //     transaksidetailparcel:gettransaksidetailparcel
             // }
             const getcart=[
                 {
                     user:getUser
                 },
                 {
                 transaksi:gettransaksi,
                 transaksidetailsatuan:gettransaksidetailsatuan,
                 transaksiparcel:gettransaksiparcel,
                 transaksidetailparcel:gettransaksidetailparcel
                 }
             ]
             return res.send(getcart)

        }catch(error){
            return res.status(500).send({message:error.message})
        }

    },

    newLogin:async(req,res)=>{
        const {email,password}=req.body
        try{
            // login
            let hashpassword = encrypt(password)
            let sql=`select * from users where email = ${db.escape(email)} and password = ${db.escape(hashpassword)}`
            const getUser = await DbPROMselect(sql)
            console.log(getUser[0].id)
            
            // check total transaksi

            sql=`select * from transaksi where users_id=${getUser[0].id} and status="oncart"`
            const isOncart=await DbPROMselect(sql)
            if(isOncart.length){
                sql=`select sum(hargatotal) as totaltransaksi, sum(modal) as totalmodal from transaksidetail
                where transaksi_id=${db.escape(isOncart[0].id)} and isdeleted=0;`
                const updatetotaltransaksi=await DbPROMselect(sql)
                console.log(updatetotaltransaksi[0].transaksi_id)
                senttosql={
                    totaltransaksi:updatetotaltransaksi[0].totaltransaksi,
                    totalmodal:updatetotaltransaksi[0].totalmodal
                }
                sql=`update transaksi set ${db.escape(senttosql)} where id=${isOncart[0].id}`
                const updatetransaksi=await DbPROMselect(sql)
                console.log(updatetransaksi)
            }

            // Get All Transaksi parcel dan satuan.
            // Selanjutnya get sesuai parcel atau product id yg bukan 0
            sql=`select * from transaksi
            where status='oncart' and users_id=${db.escape(getUser[0].id)}`
            const gettransaksi=await DbPROMselect(sql)

            sql=`select td.transaksi_id as transaksi_id,products_id, nama, image, td.id as transaksidetail_id, harga as hargasatuan, 
            td.hargatotal, td.qty from transaksi t
            join transaksidetail td on td.transaksi_id=t.id
            join products p on p.id=td.products_id
            where t.status='oncart' and t.users_id=${db.escape(getUser[0].id)} and td.isdeleted=0 and td.parcel_id=0;`
            const gettransaksidetailsatuan=await DbPROMselect(sql)

            sql=`select td.transaksi_id as transaksi_id,products_id, nama, gambar, td.id as transaksidetail_id, harga as hargasatuan, 
            td.hargatotal, td.qty, td.message from transaksi t
            join transaksidetail td on td.transaksi_id=t.id
            join parcel p on p.id=td.parcel_id
            where t.status='oncart' and t.users_id=${db.escape(getUser[0].id)} and td.isdeleted=0 and td.products_id=0;`
            const gettransaksiparcel=await DbPROMselect(sql)

            sql=`select td.transaksi_id as transaksi_id,td.id as transaksidetail_id,td.parcel_id as parcel_id, 
            td.qty as qtyparcel,td.hargatotal, 
            pa.nama as namaparcel, pa.harga as hargaparcel, tdhp.id as productinparcel_id,
            tdhp.products_id as products_id, p.nama as namaproduct, tdhp.qty as qtyproduct  from transaksi t
            join transaksidetail td on td.transaksi_id=t.id
            join transaksidetail_has_products tdhp on tdhp.transaksidetail_id=td.id
            join products p on p.id=tdhp.products_id
            join parcel pa on pa.id=td.parcel_id
            where t.status='oncart' and t.users_id=${db.escape(getUser[0].id)} and td.isdeleted=0 and td.products_id=0; `
            const gettransaksidetailparcel=await DbPROMselect(sql)

            // const getcart={
            //     user:getUser,
            //     transaksi:gettransaksi,
            //     transaksidetailsatuan:gettransaksidetailsatuan,
            //     transaksiparcel:gettransaksiparcel,
            //     transaksidetailparcel:gettransaksidetailparcel
            // }
            const getcart=[
                {
                    user:getUser
                },
                {
                transaksi:gettransaksi,
                transaksidetailsatuan:gettransaksidetailsatuan,
                transaksiparcel:gettransaksiparcel,
                transaksidetailparcel:gettransaksidetailparcel
                }
            ]
            return res.send(getcart)

        }catch(error){
            return res.status(500).send({message:error.message})
        }
    },
    Login:(req,res)=>{
        const {email,password}=req.body
        let hashpassword = encrypt(password)
        
        let sql=`select * from users where email = ? and password = ?`
        // select * from users where (email = 'bayu darmawan' or nama = 'bayu darmawan') and password = 'bayu'; 
        // let sql = `select * from users where (email = ? or nama = ?) and password = ?`
        db.query(sql,[email,hashpassword],(err,datausers)=>{
            if(err)return res.status(500).send(err)
            if(!datausers.length){
                        // alert(`User tidak terdaftar`)
                        console.log('user tidak terdaftar, auth controller line 19')
                        return res.status(500).send({message:'user tidak terdaftar'})
                    }else {
                        console.log('masuk ke')
                        console.log(datausers[0], ' ini datauser line 22')
                        // return res.send({datauser:datausers[0]})
                        sql=`
                        select * from cart c
                         join users u on u.id = c.UserId
                         join products p on p.id = c.ProductId
                         where c.UserId = ?`
            
                         db.query(sql,[datausers[0].id], (err,cart)=>{
                             if(err){
                                 console.log(err)
                                 return res.status(500).send(err)
                             }
                             const token = createJWToken({id:datausers[0].id, username:datausers[0].username})
                             datausers[0].token = token
                             return res.send({datauser:datausers[0],cart})
                         })
                    }
        })
    
        console.log(hashpassword)
    },
        // db.query(sql,[email,password],(err,datausers)=>{
        //     if(err){
        //         console.log(err)
        //         return res.status(500).send(err)
        //     }
        //     if(!datausers.length){
        //         // alert(`User tidak terdaftar`)
        //         console.log('user tidak terdaftar, auth controller line 19')
        //         return res.status(500).send({message:'user tidak terdaftar'})
        //     }else {
        //         console.log('masuk ke')
        //         console.log(datausers[0], ' ini datauser line 22')
        //         // return res.send({datauser:datausers[0]})
        //         sql=`
        //         select * from cart c
        //          join users u on u.id = c.UserId
        //          join products p on p.id = c.ProductId
        //          where c.UserId = ?`
    
    //Table user di database yang non-null diubah menjadi hanya id dan email
    SentOtpRegister:async (req,res)=>{
        let {email}=req.body
        let otpnew=OtpCreate()
        let senttosql={
            otp:otpnew.otptoken
        }
        let sql=`select id,email,statusver from users where email = ${db.escape(email)}`
        try{
            const responduser=await DbPROMselect(sql)
            if(responduser.length){ 
                console.log(responduser[0].statusver)
                if(responduser[0].statusver==1){
                    console.log("sudah ada")
                    return res.send({message:"Email sudah terdaftar",isnext:false})
                }
                // Jika email sudah ada maka perbarui OTP
                sql=`update users set ${db.escape(senttosql)} where id=${db.escape(responduser[0].id)}`
                const userupdate=await DbPROMselect(sql)
            }else{
                senttosql={...senttosql,email}

                sql=`insert into users set ${db.escape(senttosql)}`
                const userupdate=await DbPROMselect(sql)
            }
            const htmlrender=fs.readFileSync('./src/emailtemplate/verification.html','utf8')
            const template=handlebars.compile(htmlrender) //return function
            const link= `${Link_Frontend}/register`
            const otp=`${otpnew.otp}`
            const expTime=moment(otpnew.expTime).format('MMMM Do YYYY, h:mm:ss a')
            const htmlemail=template({email:email,link:link,otp:otp,expTime:expTime})

            transporter.sendMail({
                from:"Sorry<hearttoheart@gmail.com>",
                to:email,
                subject:'OTP',
                html:htmlemail,
                attachments: 
                [
                    {
                        filename: 'image.png',
                        path: 'http://localhost:8000/frontend/logoblue.png',
                        cid: 'logoblue' //same cid value as in the html img src
                    },
                    {
                        filename: 'image2.png',
                        path: 'http://localhost:8000/frontend/footeremail.png',
                        cid: 'footer' //same cid value as in the html img src
                    },
                ]
            },(err)=>{
                if(err){
                    console.log(err)
                    return res.status(500).send({message:err.message})
                }
                console.log("OTP Berhasil dikirim")
                return res.send(true)
            })

        }catch(err){
            console.log(err)
            return res.status(500).send(err)
        }
    },
    ConfirmOtp: async (req,res)=>{
        let {otp,email}=req.body
        let sql=`select otp from users where email = ${db.escape(email)}`
        // Ambil OTP Token dari Database
        try{
            const otptoken=await DbPROMselect(sql)
            let istrue=OtpConfirm(otp,otptoken[0].otp)
            // Menyamakan OTP dari User dan Database

            if(istrue===true){
                let senttosql={otp:""}
                // let senttosql={statusver:1,otp:""}
                // Update status verifikasi menjadi 1:Terverifikasi
                sql=`update users set ${db.escape(senttosql)} where email=${db.escape(email)}`
                const userupdate=await DbPROMselect(sql)
                sql=`select otp from users where email = ${db.escape(email)}`
                const getUser=await DbPROMselect(sql)
                return res.status(200).send({message:'OTP Benar',getUser})
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
    Register:async(req,res)=>{
        const {nama,email,password,alamat,nomortelfon} = req.body
        if(password==null || nomortelfon==null){
            return res.status(500).send("Ada kesalahan")
        }
        let senttosql={
            nama,
            password:encrypt(password),
            lastlogin:new Date(),
            alamat,
            nomortelfon,
            statusver:1
        }

        let sql=`update users set ${db.escape(senttosql)} where email=${db.escape(email)}`
        const userupdate=await DbPROMselect(sql)
        sql=`select id,nama,email,role,alamat,nomortelfon from users where email=${db.escape(email)}`
        const getUser=await DbPROMselect(sql)
        const token=createJWToken({id:getUser[0].id,email:getUser[0].email})
        getUser[0].token=token
        
        return res.send(getUser[0])
    },

    changeAdmin:(req,res)=>{
        let {id}= req.body
        let sql=`update users set ? where id = ${db.escape(id)}`
        let dataupdate = {
            role:'admin'
        }
        db.query(sql,dataupdate,(err,result)=>{
            if(err) return res.status(500).send(err)
            sql=`select * from users`
            db.query(sql,(err,datauser)=>{
                if(err)return res.status(500).send(err)
                return res.send(datauser)
            })
        })
    },

    changeUser:(req,res)=>{
        let{id}=req.body
        let sql=`update users set ? where id = ${db.escape(id)}`
        let dataupdate= {
            role:'user'
        }
        db.query(sql,dataupdate,(err,result)=>{
            if(err) return res.status(500).send(err)
            sql=`select * from users`
            db.query(sql,(err,datauser)=>{
                if(err) return res.status(500).send(err)
                return res.send(datauser)
            })

        })
    },

    newDeleteUser:(req,res)=>{
        let{id}=req.body
        let sql=`update users set ? where id = ${db.escape(id)}`
        let dataUpdate={
            isdeleted:1
        }
        db.query(sql,dataUpdate,(err,result)=>{
            if(err) return res.status(500).send(err)
            return res.send(result)
        })
    },
    deleteUser:(req,res)=>{
        let {id}=req.body
        let sql=`delete from users where id =${id}`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            sql=`select * from users`
            db.query(sql,(err,datauser)=>{
                if(err) return res.status(500).send(err)
                return res.send(datauser)
            })
        })
    }
    // deleteProduct:(req,res)=>{
    //     let {id} = req.body
    //     let sql =`delete from products where id=${id} `
    //     db.query(sql,(err,result)=>{
    //         if(err) return res.status(500).send(err)
    //         sql=`select * from products` 
    //         db.query(sql,(err,dataproduct)=>{
    //             if(err) return res.status(500).send(err)
    //             return res.status(200).sed(dataproduct)
    //         })
    //     })
    // },
}