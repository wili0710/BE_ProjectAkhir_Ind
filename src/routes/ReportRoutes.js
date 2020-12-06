const Router=require('express').Router()
const {ReportController}=require('./../controllers')

Router.get('/getreportincome',ReportController.IncomeReport)

module.exports=Router