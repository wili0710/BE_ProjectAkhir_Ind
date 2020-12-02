const Router=require('express').Router()
const {TransactionControllers}=require('./../controllers')

// Uji coba, sifatnya sementara
Router.post('/transaksi',TransactionControllers.transaksi)


module.exports=Router