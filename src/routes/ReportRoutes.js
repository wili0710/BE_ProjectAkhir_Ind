const Router=require('express').Router()
const {ReportController}=require('./../controllers')

Router.get('/getreportincome',ReportController.IncomeReport)
Router.get('/getreportproductsales',ReportController.ProductReport)

module.exports=Router