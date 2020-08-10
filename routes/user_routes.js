const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//////////////////////////////////////////////////

router.use(authController.protect); // runs this middleware before the routes below(Protect all routes after this middleware)

router.get('/me', userController.getMe, userController.getUser); // get details of currently logged user

router.patch('/updateMyPassword', authController.updatePassword);
router.patch(
   '/updateMe',
   userController.uploadUserPhoto,
   userController.resizeUserPhoto,
   userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin')); /////////////

router.route('/').get(userController.getAllUsers).post(userController.createUser);
router
   .route('/:id')
   .get(userController.getUser)
   .patch(userController.updateUser)
   .delete(userController.deleteUser);

module.exports = router;
