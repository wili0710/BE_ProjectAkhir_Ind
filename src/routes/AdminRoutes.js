const Router=require('express').Router()
const {AdminControllers}=require('./../controllers')

Router.get('/getalluser',AdminControllers.getAllUser)
Router.post('/changepassword',AdminControllers.changePassword)


module.exports=Router