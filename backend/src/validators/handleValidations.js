const { validationResult } = require('express-validator');

function handleValidation(req, res) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const formattedErrors = {};
    result.array().forEach(err => {
      if (!formattedErrors[err.path]) {
      formattedErrors[err.path] = err.msg;
      }
    });
    return res.status(400).json({ errors: formattedErrors });
  }
  return null;
}

module.exports = handleValidation;