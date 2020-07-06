const fs = require('fs');

// Read api
const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// Middleware handler
exports.checkID = (req, res, next, val) => {
   const id = req.params.id * 1; //convert string to number
   const tour = tours.find((el) => el.id === id);
   if (!tour) {
      return res.status(404).json({
         status: 'fail',
         message: 'invalid id',
      });
   }
   next();
};

exports.checkBody = (req, res, next) => {
   if (!req.body.name || !req.body.price) {
      res.status(400).json({
         status: 'fail',
         message: 'missing name or price',
      });
   }
   next();
};

// Route handlers
exports.getAllTours = (req, res) => {
   res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
         tours,
      },
   });
};

exports.getTour = (req, res) => {
   const id = req.params.id * 1; //convert string to number
   const tour = tours.find((el) => el.id === id);
   res.status(200).json({
      status: 'success',
      data: {
         tour,
      },
   });
};

exports.createTour = (req, res) => {
   const newId = tours[tours.length - 1].id + 1;
   const newTour = Object.assign({ id: newId }, req.body);
   tours.push(newTour);
   fs.writeFile(`${__dirname}/../dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
      res.status(201).json({
         status: 'success',
         data: {
            tour: newTour,
         },
      });
   });
};

exports.updateTour = (req, res) => {
   const id = req.params.id * 1; //convert string to number
   const tour = tours.find((el) => el.id === id);
   res.status(200).json({
      status: 'success',
      data: {
         tour: '<updated tour here>',
      },
   });
};

exports.deleteTour = (req, res) => {
   const id = req.params.id * 1; //convert string to number
   const tour = tours.find((el) => el.id === id);
   res.status(204).json({
      status: 'success',
      data: null,
   });
};
