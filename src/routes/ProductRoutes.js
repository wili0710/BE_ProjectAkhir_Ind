const Router=require('express').Router()
const {ProductControllers}=require('./../controllers')

Router.post('/addproduct',ProductControllers.addProduct)
Router.get('/getallproduct',ProductControllers.getAllProduct)
Router.post('/addProductimage',ProductControllers.addProductWithPhoto)
Router.get('/getallcatprod',ProductControllers.getCategoryProd)
Router.get('/getallcatparcel',ProductControllers.getCategoryParcel)
Router.post('/addCatParcel',ProductControllers.addCategoryParcel)
Router.post('/addCatProd',ProductControllers.addCategoryProduct)

Router.delete('/deleteprod',ProductControllers.deleteProduct)
Router.delete('/deletecatprod',ProductControllers.deleteCatproduct)
Router.delete('/deletecatparcel',ProductControllers.deleteCatParcel)

module.exports=Router

