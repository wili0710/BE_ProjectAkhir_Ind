const {db}=require('../connections')
const {uploader} = require('./../helpers/uploader')
const fs=require('fs')

module.exports={
    
    addProduct:(req,res)=>{
        
        const {nama,image,harga,stok,deskripsi,categoryproduct_id}= req.body
        let senttosql={
            nama,image,harga,stok,deskripsi,categoryproduct_id
        }

        let sql=`insert into products set ?`
        
        db.query(sql,senttosql,(err,result)=>{
            if(err) return res.status(500).send({message:err})
            console.log('berhasil post data product')
            sql=`select * from products`
            db.query(sql,(err,dataproduct)=>{
                if(err) return res.status(500).send({message:err})
                return res.send({dataproduct})
            })
        })

    },
    addCategoryParcel:(req,res)=>{
        const {nama} = req.body
        console.log(nama)
        let nama2 = {nama}
        // insert set itu harus dalam object
        let sql = `insert into categoryparcel set ?`
        db.query(sql,nama2,(err,result)=>{
            if(err) return res.status(500).send({message:err})
            console.log('berhasil post data cat parcel')
            sql=`select * from categoryparcel`
            db.query(sql,(err,datacatparcel)=>{
                if(err)return res.status(500).send({message:err})
                return res.send(datacatparcel)
            })
        }) 
    },
    addCategoryProduct:(req,res)=>{
        const {nama} = req.body
        let nama2= {nama}
        let sql=`insert into categoryproduct set ?`
        db.query(sql,nama2,(err,result)=>{
            if(err) return res.status(500).send({message:err})
            console.log('berhasil post data car product')
            sql=`select * from categoryproduct`
            db.query(sql,(err,datacatprod)=>{
                if(err) return res.status(500).send({message:err})
                return res.send(datacatprod)
            })
        })
    },
    
    getAllProduct:(req,res)=>{
        let sql=`select * from Products`
        db.query(sql,(err,product)=>{
            if(err) return res.status(500).send({message:err})
            return res.send(product)
        })
    },

    addProductWithPhoto:(req,res)=>{
        try{
            const path='/product'
            const upload= uploader(path,'PROD').fields([{name:'image'}])
            upload(req,res,(err)=>{
                if(err){
                    console.log(err)
                    return res.status(500).json({message:'upload picture failed',error:err.message})
                }
                    
                
                
                const {image}=req.files
                const imagePath=image? path + '/' + image[0].filename : null
                console.log(imagePath,'ini image path line 43')
                console.log(req.body.data, 'in ireq body data line 44')
                const data = JSON.parse(req.body.data)
                data.image= imagePath

                console.log(data, ' ini data line 48')
                db.query(`insert into products set ? `, data ,(err)=>{
                    if(err){
                        if(imagePath){
                            fs.unlinkSync('./public'+imagePath)

                        }
                        return res.status(500).send(err)
                    }
                    let sql = `select * from products`

                    db.query(sql,(err,dataProduct)=>{
                        if(err) return res.status(500).send(err)
                        return res.status(200).send(dataProduct)
                    })
                })
            })
            console.log('berhasil upload')
        }catch(err){

        }
    },

    getCategoryProd:(req,res)=>{
        let sql = `select * from categoryproduct`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            return res.send(result)
        })
    },
    getCategoryParcel:(req,res)=>{
        let sql = `select * from categoryparcel`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            return res.send(result)
        })
    },

    
    

  


}