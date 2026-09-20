// Wraps an async Express route/controller so any rejected promise is forwarded
// to next(err) instead of crashing the process or requiring a try/catch in
// every single controller function.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
