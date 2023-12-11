class APIFeatures {
  constructor(query, queryString) {
    //This constructor function gets called whenever new obejct is made from this class. query is mongoose query & queryString is coming from express route.
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A) Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 1B) Advanced Filtering
    // { difficulty: 'easy', duration: { $gte: 5 } }
    // { difficulty: 'easy', duration: { gte: '5' } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // console.log(JSON.parse(queryStr));
    // const query = Tour.find(queryObj);

    // let query = Tour.find(JSON.parse(queryStr));
    this.query = this.query.find(JSON.parse(queryStr));

    return this; //The entire object, important becoz only then we can chain all these methods.
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    //Ex: query = query.select('name duration price'); //This operation of selecting only certain fields names is called projecting.
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  pagination() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    // page=2&limit=10, 1-10 page:1, 11-20 page:2, 21-30 page:3...
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
