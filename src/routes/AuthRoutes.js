const Router=require('express').Router()
const {AuthControllers}=require('./../controllers')

Router.post('/s_r_otp',AuthControllers.SentOtpRegister)
Router.post('/c_otp',AuthControllers.ConfirmOtp)
Router.post('/register',AuthControllers.Register)
Router.post('/login',AuthControllers.Login)

Router.post(`/changeadmin`,AuthControllers.changeAdmin)
Router.post('/changeuser',AuthControllers.changeUser)
Router.delete('/deleteuser',AuthControllers.deleteUser)

module.exports=Router