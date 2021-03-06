const Router=require('express').Router()
const {AuthControllers}=require('./../controllers')

Router.post('/s_r_otp',AuthControllers.SentOtpRegister)
Router.post('/resetpassword_otp',AuthControllers.ResetPassword_Otp)
Router.post('/resetpassword',AuthControllers.ResetPassword)
Router.post('/c_otp',AuthControllers.ConfirmOtp)
Router.post('/register',AuthControllers.Register)
Router.post('/login',AuthControllers.Login)
Router.post('/newlogin',AuthControllers.newLogin)
Router.post(`/changeadmin`,AuthControllers.changeAdmin)
Router.post('/changeuser',AuthControllers.changeUser)
Router.delete('/deleteuser',AuthControllers.deleteUser)
Router.post('/newkeeplogin',AuthControllers.newKeepLogin)
Router.post('/newdeleteuser',AuthControllers.newDeleteUser)

module.exports=Router