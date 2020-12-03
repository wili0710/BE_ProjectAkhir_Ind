const {db}=require('../connections')

module.exports={
    getAllUser:(req,res)=>{
        let sql=`select * from users where isdeleted=0`
        db.query(sql,(err,datausers)=>{
            if(err) return res.status(500).send(err)
            return res.send(datausers)
        })
    },
    
    

}