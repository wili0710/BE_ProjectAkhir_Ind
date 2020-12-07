const Router = require('express').Router()
const {ParcelController}=require('../controllers')

Router.post('/addparcel', ParcelController.addParcel);
Router.post('/uploadimage', ParcelController.uploadParcelImg);
Router.post('/deleteimage', ParcelController.deleteParcelImg);


module.exports = Router;