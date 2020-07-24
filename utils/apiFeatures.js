class APIFeatures {
   constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
   }

   filter() {
      // 1A) Filtering
      const queryObj = { ...this.queryString }; //Make a copy
      const excludedFields = ['page', 'sort', 'limit', 'fields'];
      excludedFields.forEach((el) => delete queryObj[el]); //Exclude fields

      //  1B) Advance Filtering
      let queryString = JSON.stringify(queryObj);
      queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

      this.query = this.query.find(JSON.parse(queryString));
      // let query = Tour.find(JSON.parse(queryString)); //Get tours with query
      return this;
   }

   sort() {
      // 2) Sorting
      if (this.queryString.sort) {
         const sortBy = this.queryString.sort.split(',').join(' '); // split by ',' and then join by space
         this.query = this.query.sort(sortBy);
         // sort('price ratingsAverage') => Sort 1st by price and 2nd by ratingAverage
      } else {
         this.query = this.query.sort('-createdAt'); // By default sort by created date
      }

      return this;
   }

   limitFields() {
      // 3) Field limiting
      if (this.queryString.fields) {
         const fields = this.queryString.fields.split(',').join(' ');
         this.query = this.query.select(fields);
         // query = query.select('name duration price') => select name duration price only
      } else {
         // Default
         this.query = this.query.select('-__v'); // '-' to exclude
      }

      return this;
   }

   paginate() {
      // 4) Pagination
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 100;
      const skip = (page - 1) * limit;
      this.query = this.query.skip(skip).limit(limit);

      // if (this.queryString.page) {
      //    const numTours = await Tour.countDocuments();
      //    if (skip >= numTours) throw Error('This page does not exist');
      // }

      return this;
   }
}

module.exports = APIFeatures;
