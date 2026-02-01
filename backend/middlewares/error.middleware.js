export default function errorHandler(err, req, res, next) {
  console.error(err); // In prod route to a logging service
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({
    status: "error",
    message,
    details: err.details || null,
  });
}
