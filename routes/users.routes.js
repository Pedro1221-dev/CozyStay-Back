// Importing the express module
const express = require('express');
// Creating an instance of the express router
const router = express.Router();

// Importing multer 
const upload = require('../config/multerConfig'); 

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
    .get( checkAuth, userController.findOneCurrent )  // PROTECTED (user logged in)
    .patch( checkAuth, upload.fields([{ name: 'url_avatar', maxCount: 1 }, { name: 'url_banner', maxCount: 1 }]), userController.updateCurrent ) // PROTECTED (user logged in)

router.route('/current/properties')
    .get( checkAuth, userController.findPropertiesCurrent ) // PROTECTED (user logged in)

router.route('/current/bookings')
    .get( checkAuth, userController.findBookingsCurrent ) // PROTECTED (user logged in)

router.route('/current/favorites')
    .get( checkAuth, userController.findFavoritePropertiesCurrent ) // PROTECTED (user logged in)
    .post( checkAuth, userController.addFavorite ) // PROTECTED (user logged in)

router.route('/current/favorites/:property_id')
    .delete( checkAuth, userController.deleteFavorite ) // PROTECTED (user logged in)

router.route('/:user_id')
    .get( userController.findOne )  // PUBLIC
    .delete( checkAuth, userController.delete) // PROTECTED (user logged in)
    .patch( checkAuth, checkAdmin, userController.update) // PROTECTED (admin logged in)

router.route('/:user_id/properties')
    .get( userController.findProperties )  // PUBLIC

router.route('/verify-email')
    .post( userController.verifyEmail ) // PUBLIC

router.route('/resend-email')
    .post( userController.resendEmail ) // PUBLIC

router.route('/login')
    .post( userController.login ) // PUBLIC

router.route('/forgot-password')
    .post( userController.forgotPassword ) // PUBLIC

router.route('/reset-password/:token')
    .patch( userController.resetPassword ) // PUBLIC


router.all('*', (req, res) => {
    res.status(404).json({ message: 'CozyStay: what???' }); //send a predefined error message
})

//export this router
module.exports = router;