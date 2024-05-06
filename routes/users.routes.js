const express = require('express');
const router = express.Router();

// import user controller middleware
const userController = require("../controllers/user.controller");

router.route('/')
    .get( userController.findAll )
    .post(userController.create) 

router.route('/:user_id')
    .get( userController.findOne ) 
    .delete( userController.delete)
    .patch(userController.update)

router.route('/:user_id/properties')
    //.get( usersController.xxx ) 

router.route('/current')
    //.get( usersController.xxx )
    //.patch( usersController.xxx )

router.route('/current/properties')
    //.get( usersController.xxx )

router.route('/current/bookings')
    //.get( usersController.xxx )

router.route('/current/favorites')
    //.get( usersController.xxx )
    //.post( usersController.xxx )

router.route('/current/favorites/:property_id')
    //.delete( usersController.xxx )

router.route('/verifyEmail')
    //.post( usersController.xxx )

router.route('/login')
    //.post( usersController.xxx )


router.all('*', (req, res) => {
    res.status(404).json({ message: 'CozyStay: what???' }); //send a predefined error message
})

//export this router
module.exports = router;