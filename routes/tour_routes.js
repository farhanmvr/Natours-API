const express = require('express');

const tourController = require('../controllers/tourController');

// Create router
const router = express.Router();

// Middleware to check if id exist
router.param('id', tourController.checkID);

// Routes
router
   .route('/')
   .get(tourController.getAllTours)
   .post(tourController.checkBody, tourController.createTour);
router
   .route('/:id')
   .get(tourController.getTour)
   .patch(tourController.updateTour)
   .delete(tourController.deleteTour);

// Export
module.exports = router;
