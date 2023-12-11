module.exports = func => (req, res, next) => {
  func(req, res, next).catch(next);
  // func(req, res, next).catch(err => next(err)); SAME AS ABOVE
};
