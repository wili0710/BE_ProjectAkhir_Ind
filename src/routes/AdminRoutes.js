const Router=require('express').Router()
const {AdminControllers}=require('./../controllers')

Router.get('/getalluser',AdminControllers.getAllUser)

module.exports=Router