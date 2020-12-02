const Router=require('express').Router()
const {AuthControllers}=require('./../controllers')

Router.post('/s_r_otp',AuthControllers.SentOtpRegister)
Router.post('/c_otp',AuthControllers.ConfirmOtp)
Router.post('/register',AuthControllers.Register)
Router.post('/login',AuthControllers.Login)

module.exports=Router