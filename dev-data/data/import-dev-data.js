const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');
// Config env variables
dotenv.config({ path: './config.env' });

// Connect to DB
mongoose
   .connect(process.env.DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
   })
   .then(() => {
      console.log('Connected to DB.....');
   });

// Read json
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// Import data to db
const importData = async () => {
   try {
      await Tour.create(tours);
      await User.create(users, { validateBeforeSave: false });
      await Review.create(reviews);
      console.log('import success');
   } catch (err) {
      console.log(err);
   }
   process.exit();
};

// Delete all data
const deleteData = async () => {
   try {
      await Tour.deleteMany();
      await User.deleteMany();
      await Review.deleteMany();
      console.log('Deleted');
   } catch (err) {
      console.log(err);
   }
   process.exit();
};

if (process.argv[2] === '--import') {
   importData();
} else if (process.argv[2] === '--delete') {
   deleteData();
}
