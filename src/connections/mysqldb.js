const mysql=require('mysql')
const db=mysql.createConnection({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASS,
    database :process.env.DB_DATABASE,
    port : 3306
})
// const db=mysql.createConnection({
//     host:'db4free.net',
//     user:'gorillaworkout',
//     password:'Terserahgue1',
//     database :'gratisan',
//     port : 3306
// })
db.connect((err)=>{
    if(err){
        console.log('error database cok')
    }else {
        console.log('success  connect dengan db4free')

    }
})

// db.connect((err)=>{
//     if(err){
//         console.log('error database cok')
//     }else {
//         console.log('success  connect dengan db')

//     }
// })
module.exports = db