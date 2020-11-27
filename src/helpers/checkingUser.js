module.exports={
    checkuser:(req,res,next)=>{
        if(req.user.id==req.query.userid){
            next()
        }else {
            return res.status(401).json({message:'User not Authorized',error:'User not Authorized'})
        }
    }
}