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


Router.post('/deleteprod',ProductControllers.deleteProd)
Router.post('/deletecatprod',ProductControllers.deleteCatProd)
Router.post('/deletecatparcel',ProductControllers.deleteCatParcel)

Router.get('/getDataParcel',ProductControllers.getDataParcel)
Router.post('/getDataParcelByAll',ProductControllers.getDataParcelByAll)
Router.post('/getDataProductMinuman',ProductControllers.getDataProductMinuman)
Router.post('/getDataProductMakanan',ProductControllers.getDataProductMakanan)
Router.post('/getDataProductChocolate',ProductControllers.getDataProductChocolate)
Router.get('/getDataParcelById/:id',ProductControllers.getDataParcelById)
Router.post('/getAllProductByCategory/',ProductControllers.getAllProductByCategory)


module.exports=Router

