const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors=require('cors')
const bearerToken=require('express-bearer-token')

require('dotenv').config()

const PORT =  8000



app.use(cors())
app.use(bearerToken())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))
app.use(express.static('public'))

app.get('/',(req,res)=>{
    res.send('<h1>API Project Akhir Kelompok 2 </h1>')
})
// const {ProductRoutes,karyawanRoutes,usersRoutes,MongoRoutes,MongooseRouters,SocketRoutes} = require('./Routes')
const {AuthRoutes } = require('./src/Routes')

app.use('/auth',AuthRoutes)
// app.use('/product',ProductRoutes)
// app.use('/trans',TransactionsRoutes)


// var schedule=require('node-schedule')

// var j = schedule.scheduleJob(" */10 *  * * * *",function(){
//     console.log('the answer to life, the universe, and everything')
// })

// app.listen(5000,()=>console.log('port active'))
app.listen(PORT,()=>console.log('port server active' + PORT))
