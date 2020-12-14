const {db}=require('../connections')
const {encrypt}= require('../helpers')

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
    getAllUser:(req,res)=>{
        let sql=`select * from users where statusver = 1`
        db.query(sql,(err,datausers)=>{
            if(err) return res.status(500).send(err)
            return res.send(datausers)
        })
    },

    // changePhone:(req,res)=>{
    //     let {id,nomortelfon}= req.body
    //     let sql=`select * from users where id =${db.escape(id)}`
    //         let data ={
    //             nomortelfon
    //         }
    //         db.query(sql,data,(err,result)=>{
    //             if(err)return res.status(500).semd({message:err.message})

    //         })
    // }   
    
   changePassword:async(req,res)=>{
       try{
            const {id,password}= req.body
            let sql=`select * from users where id =${db.escape(id)}`
            const getUser = await DbPROMselect(sql)

            let dataupdate={
                password:encrypt(password)
            }
            sql=`update Users set ${db.escape(dataupdate)} where id = ${db.escape(id)}`
            const userupdate=await DbPROMselect(sql)

            sql=`select * from users where id = ${db.escape(id)}`
            const finalUser=await DbPROMselect(sql)
            return res.send(finalUser)
       }catch(error){
           console.log(error)
       }
   }
    

}