const Router = require('express').Router()
const {ParcelController}=require('../controllers')

Router.post('/addparcel', ParcelController.addParcel)

module.exports = Router;