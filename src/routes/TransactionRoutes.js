const Router=require('express').Router()
const {TransactionControllers}=require('./../controllers')

Router.post('/addtocart',TransactionControllers.AddToCart)
Router.get('/getcart',TransactionControllers.GetCart)
Router.post('/removefromcart',TransactionControllers.RemoveFromCart)
Router.post('/addtocartproduct',TransactionControllers.AddToCartProduct)
Router.post('/checkout',TransactionControllers.Checkout)

module.exports=Router