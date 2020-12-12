const {db}=require('../connections')
const {uploader} = require('./../helpers/uploader')
const fs=require('fs')

// Ditambah wili, jngn di hapus
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
// -----------------------------
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
        let sql=`select p.id as id, 
        p.nama as nama, 
        p.image as image, 
        p.harga as harga, 
        p.stok as stok, 
        p.deskripsi as deskripsi,
        p.categoryproduct_id as categoryproduct_id,
        p.isdeleted as isdeleted,
        p.hargapokok as hargapokok,
        cp.nama as namaCategory
        from products p
        join categoryproduct cp
        on p.categoryproduct_id = cp.id
        where p.isdeleted = 0;`
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
                    let sql = `select * from products where isdeleted=0`

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
        let sql = `select * from categoryproduct where isdeleted=0`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            return res.send(result)
        })
    },
    getCategoryParcel:(req,res)=>{
        let sql = `select * from categoryparcel where isdeleted=0`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            return res.send(result)
        })
    },

    deleteProduct:(req,res)=>{
        let {id} = req.body
        let sql =`delete from products where id=${id} `
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            sql=`select * from products where isdeleted=0` 
            db.query(sql,(err,dataproduct)=>{
                if(err) return res.status(500).send(err)
                return res.status(200).sed(dataproduct)
            })
        })
    },

    deleteCatproduct:(req,res)=>{
        let {id}= req.body
        let sql=`delete from categoryproduct where id=${id}`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            sql=`select * from categoryproduct`
            db.query(sql,(err,datacat)=>{
                if(err) return res.status(500).send(err)
                return res.status(200).send(datacat)
            })
        })
    },

    deleteCatParcel:(req,res)=>{
        let {id}= req.body
        let sql=`delete from categoryparcel where id=${id}`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            sql=`select * from categoryparcel`
            db.query(sql,(err,datapar)=>{
                if(err) return res.status(500).send(err)
                return res.status(200).send(datapar)
            })
        })
    },
    deleteProd:(req,res)=>{
        let {id} = req.body
        let dataupdate={
            isdeleted:1
        }
        let sql=`update products set ? where id = ${id}`
        
        db.query(sql,dataupdate,(err,result)=>{
            if(err) return res.status(500).send(err)
            sql=`select * from products where isdeleted=0`
            db.query(sql,(err,dataproduct)=>{
                if(err) return res.status(500).send(err)
                return res.send(dataproduct)
            })
        })
    },
    deleteCatProd:(req,res)=>{
        let {id}= req.body
        let dataupdate={
            isdeleted:1
        }
        let sql=`update categoryproduct set ? where id =${id}`

        db.query(sql,dataupdate,(err,result)=>{
            if(err) return res.status(500).send(err)
            sql=`select * from categoryproduct where isdeleted=0`
            db.query(sql,(err,datacatprod)=>{
                if(err) return res.status(500).send(err)
                return res.send(datacatprod)
            })
        })
    },

    deleteCatParcel:(req,res)=>{
        let{id}=req.body
        let dataupdate={
            isdeleted:1
        }
        let sql=`update categoryparcel set ? where id=${id}`
        db.query(sql,dataupdate,(err,result)=>{
            if(err) return res.status(500).send(err)
            sql=`select * from categoryparcel where isdeleted=0`
            db.query(sql,(err,datacatpar)=>{
                if(err) return res.status(500).send(err)
                return res.send(datacatpar)
            })
        })
    },

    getDataParcel:(req,res)=>{
        let sql=`select * from parcel 
        where isdeleted = 0;`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            return res.send(result)
        })
    },
    getDataParcelByAll:(req,res)=>{
        let sql= `select * from parcel p 
        join parcel_has_categoryproduct ph
        on p.id=ph.parcel_id
        join categoryproduct cp
        on cp.id = ph.categoryproduct_id`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            return res.send(result)
        })
    },
    getDataParcelById:(req,res)=>{
        let {id}=req.params
        let sql=`select p.gambar as gambar,
        p.id as id,
        p.categoryparcel_id as categoryparcel_id,
        p.harga as harga,
        p.nama as namaParcel,
        ph.parcel_id as parcel_id,
        ph.categoryproduct_id as categoryproduct_id,
        ph.qty as qty,
        cp.nama as namaProduct,
        p.isdeleted as isdeleted
         from parcel p 
                join parcel_has_categoryproduct ph
                on p.id=ph.parcel_id
                join categoryproduct cp
                on cp.id = ph.categoryproduct_id
                where p.id = ${db.escape(id)} and p.isdeleted=0;`
        db.query(sql,(err,result)=>{
            if(err)return res.status(500).send(err)
            return res.send(result)
        })
    },

    getDataProductMinuman:(req,res)=>{
        let sql=`select * from products where categoryproduct_id =1 and isdeleted=0`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            return res.send(result)
        })
    },
    getDataProductMakanan:(req,res)=>{
        let sql=`select * from products where categoryproduct_id=2 and isdeleted=0`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            return res.send(result)
        })
    },
    getDataProductChocolate:(req,res)=>{
        let sql=`select * from products where categoryproduct_id=3 and isdeleted=0`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            return res.send(result)
        })
    },

    getDataProductById:(req,res)=>{
        let {id} = req.body
        let sql=`select * from products where id = ${db.escape(id)};`

        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send(err)
            return res.send(result)
        })
    },
    // Wili menambahkan dibawah ini, utk di cart page. Jangan di hapus kecuali klo di atas sudah ada yg sama respon yg dikirim
    getAllProductByCategory:async(req,res)=>{
        const {categoryproduct_id}=req.body

        try {
            let sql=`select p.id, p.nama, p.image, p.harga, p.stok, p.categoryproduct_id, 
            p.hargapokok, cp.nama as categoryproduct, p.id as products_id  from products p
            join categoryproduct cp on cp.id=p.categoryproduct_id
            where p.isdeleted=0 and cp.isdeleted=0 and p.categoryproduct_id in (${db.escape(categoryproduct_id)});`
            const getAllProductByCategory=await DbPROMselect(sql)
            console.log(getAllProductByCategory)
            return res.send(getAllProductByCategory)
        } catch (error) {
            console.log(error)
            return res.status(500).send({message:error.message})
        }
    },
    
    getRandomProduct:async(req,res)=>{
        let randomNumber
        let arrIndex=[]
        let arrId=[]
        let isSame

        try {
        
            // product Satuan    
            let sql=`select id from products where isdeleted=0`
            let getProduct=await DbPROMselect(sql)

            randomNumber=Math.floor(Math.random()*getProduct.length)
            arrIndex.push(randomNumber+1)
            arrId.push(getProduct[randomNumber].id)
            for(x=1;x<2;x++){                                                // x<= ? , ? diubah menjadi jumlah list produk yg diinginkan
                do {
                    randomNumber=Math.floor(Math.random()*getProduct.length)
                    randomNumber+=1
                    isSame=arrIndex.find((finding)=>{
                        return finding == randomNumber
                    })
                } while (isSame);    
                arrIndex.push(randomNumber)   
                console.log(arrIndex) 
                arrId.push(getProduct[randomNumber-1].id)
            }
            console.log(arrId)
            sql=`select * from products where id in (${db.escape(arrId)})`
            const getRandomProductSatuan=await DbPROMselect(sql)
            
            // Parcel Random

            sql=`select id from parcel where isdeleted=0`
            let getParcel=await DbPROMselect(sql)

            arrIndex=[]
            arrId=[]
            randomNumber=Math.floor(Math.random()*getParcel.length)
            arrIndex.push(randomNumber+1)
            arrId.push(getParcel[randomNumber].id)
            for(x=1;x<2;x++){                                                // x<= ? , ? diubah menjadi jumlah list produk yg diinginkan
                do {
                    randomNumber=Math.floor(Math.random()*getParcel.length)
                    randomNumber+=1
                    isSame=arrIndex.find((finding)=>{
                        return finding == randomNumber
                    })
                } while (isSame);    

                arrIndex.push(randomNumber)    
                console.log(arrIndex) 
                arrId.push(getParcel[randomNumber-1].id)
            }
            console.log(arrId)
            sql=`select * from parcel where id in (${db.escape(arrId)})`
            const getRandomProductParcel=await DbPROMselect(sql)

            const sentData={
                productSatuan:getRandomProductSatuan,
                productParcel:getRandomProductParcel
            }

            return res.send(sentData)

        } catch (error) {
            console.log(error)
            return res.status(500).send({message:error.message})
        }
    }
    // End tambahan oleh wili utk di cart page----------------------------------
    



 


    




    
    

  


}