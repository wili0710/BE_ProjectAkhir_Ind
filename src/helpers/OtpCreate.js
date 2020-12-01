const jwt=require('jsonwebtoken')
const otpcreate=()=>{
    let otp
    do {
        otp =Math.random()
        otp=otp*10000
        otp=parseInt(otp)
        otp=`${otp}`
    } while (otp.length!==4);
    let newotp={
        otp:otp,
        otptoken:jwt.sign({otp},"spiritking",{expiresIn:'1m'})
    }
    return newotp
}

module.exports=otpcreate