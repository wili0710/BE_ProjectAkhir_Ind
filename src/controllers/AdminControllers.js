const {db}=require('../connections')

module.exports={
    getAllUser:(req,res)=>{
        let sql=`select * from users where statusver = 1`
        db.query(sql,(err,datausers)=>{
            if(err) return res.status(500).send(err)
            return res.send(datausers)
        })
    },
    
    

}