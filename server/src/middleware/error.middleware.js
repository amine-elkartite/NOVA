function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || error.status || 500
  const isProduction = process.env.NODE_ENV === 'production'

  res.status(statusCode).json({
    message: statusCode === 500 ? 'Une erreur interne est survenue.' : error.message,
    ...(isProduction ? {} : { stack: error.stack }),
  })
}

module.exports = {
  notFoundHandler,
  errorHandler,
}
