const Router=require('express').Router()
const {ProductControllers}=require('./../controllers')

Router.post('/addproduct',ProductControllers.addProduct)
Router.get('/getallproduct',ProductControllers.getAllProduct)
module.exports=Router