// Importing the express module
const express = require('express');
// Creating an instance of the express router
const router = express.Router();
// Importing middleware functions
const checkAuth = require('../middleware/check-auth');
const checkCurrent = require('../middleware/check-current');
const checkAdmin= require('../middleware/check-admin');

// import user controller middleware
const userController = require("../controllers/user.controller");

router.route('/')
    .get( checkAuth, checkAdmin, userController.findAll ) // PROTECTED (admin logged in)
    .post(userController.create)  // PUBLIC

router.route('/current')
    .get( checkAuth, userController.findOneCurrent )  // PROTECTED
    .patch( checkAuth, userController.updateCurrent ) // PROTECTED (user logged in)

router.route('/current/properties')
    .get( checkAuth, userController.findPropertiesCurrent ) // PROTECTED (user logged in)

router.route('/current/bookings')
    .get( checkAuth, userController.findBookingsCurrent ) // PROTECTED (user logged in)

router.route('/current/favorites')
    .get( checkAuth, userController.findFavoritePropertiesCurrent ) // PROTECTED (user logged in)
    .post( checkAuth, userController.addFavorite ) // PROTECTED

router.route('/:user_id')
    .get( userController.findOne )  // PUBLIC
    .delete( checkAuth, userController.delete) // PROTECTED
    .patch( checkAuth, checkAdmin, userController.update) // PROTECTED (admin logged in)

router.route('/:user_id/properties')
    .get( userController.findProperties )  // PUBLIC

router.route('/current/favorites/:property_id')
    //.delete( usersController.xxx ) // PROTECTED

router.route('/verifyEmail')
    //.post( usersController.xxx ) // PUBLIC

router.route('/login')
    .post( userController.login ) // PUBLIC


router.all('*', (req, res) => {
    res.status(404).json({ message: 'CozyStay: what???' }); //send a predefined error message
})

//export this router
module.exports = router;