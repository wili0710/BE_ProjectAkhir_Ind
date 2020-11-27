const Crypto =require('crypto')

module.exports=(password)=>{
    return Crypto.createHmac('sha256','puripuri').update(password).digest('hex')
}