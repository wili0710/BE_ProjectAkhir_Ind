const {db}=require('../connections')

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
    getAllProduct:(req,res)=>{
        let sql=`select * from Products`
        db.query(sql,(err,product)=>{
            if(err) return res.status(500).send({message:err})
            return res.send({product})
        })
    }
}