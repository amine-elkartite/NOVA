const { validationResult } = require('express-validator')

function handleValidation(req, res, next) {
  const result = validationResult(req)

  if (result.isEmpty()) {
    next()
    return
  }

  res.status(422).json({
    message: 'Veuillez corriger les champs du formulaire.',
    errors: result.array().map((error) => ({
      field: error.path,
      message: error.msg,
    })),
  })
}

module.exports = {
  handleValidation,
}
