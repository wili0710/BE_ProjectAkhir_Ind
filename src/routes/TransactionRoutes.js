const Router=require('express').Router()
const {TransactionControllers}=require('./../controllers')

// Uji coba, sifatnya sementara
Router.post('/transaksi',TransactionControllers.transaksi)
Router.post('/addtocart',TransactionControllers.AddToCart)
Router.post('/getcart',TransactionControllers.GetCart)


module.exports=Router