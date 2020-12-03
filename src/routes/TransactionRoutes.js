const Router=require('express').Router()
const {TransactionControllers}=require('./../controllers')

// Uji coba, sifatnya sementara
Router.post('/transaksi',TransactionControllers.transaksi)
Router.post('/transaksi',TransactionControllers.AddToCart)
Router.post('/transaksi',TransactionControllers.GetCart)


module.exports=Router