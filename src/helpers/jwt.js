const jwt=require('jsonwebtoken')
module.exports={
    createJWToken(payload){
    return jwt.sign(payload,"puripuri", {expiresIn:'12h'})
    }
}