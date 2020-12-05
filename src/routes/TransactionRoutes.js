const Router=require('express').Router()
const {TransactionControllers}=require('./../controllers')

// Uji coba, sifatnya sementara
Router.post('/addtocart',TransactionControllers.AddToCart)
Router.post('/getcart',TransactionControllers.GetCart)


module.exports=Router