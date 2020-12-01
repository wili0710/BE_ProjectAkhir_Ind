const Router=require('express').Router()
const {AuthControllers}=require('./../controllers')

Router.post('/login',AuthControllers.Login)

module.exports=Router