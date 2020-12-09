const Router = require('express').Router()
const {ParcelController}=require('../controllers')

Router.get  ('/getallparcel',    ParcelController.getallParcels   );
Router.post ('/addparcel',       ParcelController.addParcel       );
Router.post ('/uploadimage',     ParcelController.uploadParcelImg );
Router.post ('/deleteimage',     ParcelController.deleteParcelImg );
// Router.post ('/initnewparcel',   ParcelController.initnewParcel   );

module.exports = Router;