module.exports = (fn) => {
   return (req, res, next) => {
      fn(req, res, next).catch(next);
   };
   // (err) => next(err) is same as only writing next
   // it automatically called with parameters recieved
};
