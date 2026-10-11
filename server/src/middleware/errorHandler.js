// common error handler, keep this last in app.js
export default function errorHandler(err, req, res, next) {
  console.log("Error:", err.message);

  // multer errors (file too big etc.) are user mistakes
  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }

  const status = err.status || 500;
  // don't send internal error details (db errors etc.) to the client
  const message = status === 500 ? "Something went wrong on server" : err.message;
  res.status(status).json({ message });
}
