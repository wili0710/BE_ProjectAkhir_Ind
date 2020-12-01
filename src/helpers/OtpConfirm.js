const jwt=require('jsonwebtoken')

const otpconfirm=(otpfe,otptokensql)=>{  
    // OTP FE -> OTP Input dari user di Front-End. OTP Token SQL -> OTP dari Database SQL berupa Token.
    let otpsql=jwt.verify(otptokensql, "spiritking", (error,decoded)=>{

        // OTP Token di decoded untuk mengembalikan ke aslinya. OTP ada di otpsql.otp setelah di decoded.
        if(error){  
            console.log(error)        
            // Jika kadaluarsa maka akan muncul error.
            return "expired" 
        }
        return decoded
        
    })
    if(otpsql==="expired"){
        console.log(otpsql)
        return otpsql
    }
    if(otpfe===otpsql.otp){
        return true // Mengembalikan TRUE, OTP Benar
    }else{
        return false // Mengembalikan False, OTP Salah
    }
}

module.exports=otpconfirm