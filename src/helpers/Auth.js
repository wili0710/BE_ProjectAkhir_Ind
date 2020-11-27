const jwt=require('jsonwebtoken')

module.exports={
    auth:(req,res,next)=>{
        if(req.method !== "OPTIONS"){
            jwt.verify(req.token,"puripuri",(error,decoded)=>{
                console.log(req.token)
                if(error){
                    return res.status(401).json({message:"User not authorized",error:"user not authorized"})
                }
                console.log(decoded,'inidecoded')
                req.user=decoded
                next()
            })
        }else {
            next()
        }
    }
}