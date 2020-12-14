const Router=require('express').Router()
const {ReportController}=require('./../controllers')

Router.get('/getreportincome',ReportController.IncomeReport)
Router.get('/getreportproductsales',ReportController.ProductReport)
Router.get('/getreportTransaksi',ReportController.TransaksiReport)

module.exports=Router