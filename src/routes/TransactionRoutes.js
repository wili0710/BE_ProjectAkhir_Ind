const Router=require('express').Router()
const {TransactionControllers}=require('./../controllers')

// Uji coba, sifatnya sementara
Router.post('/addtocart',TransactionControllers.AddToCart)
Router.get('/getcart',TransactionControllers.GetCart)
Router.post('/removefromcart',TransactionControllers.RemoveFromCart)


module.exports=Router