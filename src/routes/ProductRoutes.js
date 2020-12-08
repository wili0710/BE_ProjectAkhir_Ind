const Router=require('express').Router()
const {ProductControllers}=require('./../controllers')

Router.post('/addproduct',ProductControllers.addProduct)
Router.get('/getallproduct',ProductControllers.getAllProduct)
Router.post('/addProductimage',ProductControllers.addProductWithPhoto)
Router.get('/getallcatprod',ProductControllers.getCategoryProd)
Router.get('/getallcatparcel',ProductControllers.getCategoryParcel)
Router.post('/addCatParcel',ProductControllers.addCategoryParcel)
Router.post('/addCatProd',ProductControllers.addCategoryProduct)
module.exports=Router;