const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
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
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

// Import data to db
const importData = async () => {
   try {
      await Tour.create(tours);
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
