function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Something went wrong.";
  if (error.name === "ValidationError") { statusCode = 400; message = "Validation failed."; }
  if (error.name === "CastError") { statusCode = 400; message = "Invalid resource identifier."; }
  if (error.code === 11000) { statusCode = 409; message = "A record with those values already exists."; }
  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ success: false, message, ...(error.details && { details: error.details }) });
}
module.exports = errorHandler;
