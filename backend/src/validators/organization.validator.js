const { body } = require('express-validator');

const organizationsValidator = [
  body('name')
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 3, max: 70 }).withMessage('Name must be between 3 and 70 characters.'),

  body('country')
    .notEmpty().withMessage('Country is required.'),

  body('sector')
    .notEmpty().withMessage('Sector is required.'),

  body('website')
    .notEmpty().withMessage('Website is required.')
    .isURL().withMessage('Please provide a valid URL.')
    .isLength({ max: 200 }).withMessage('Website must be at most 200 characters long.'),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description must be at most 500 characters long.'),

  body('goals')
    .isArray({ min: 1 }).withMessage('Goals are required.')
    .custom(goals => {
      // Concatenamos todos los objetivos en un solo string
      const joinedGoals = goals.join(";");
      
      // Comprobamos si la longitud total no excede los 2000 caracteres
      if (joinedGoals.length > 2000) {
        throw new Error('Goals (total) cannot exceed 2000 characters.');
      }
      
      return true;  // Si la validación pasa, devuelve true
    }),

  body('factors')
    .isArray({ min: 1 }).withMessage('Factors are required.')
    .custom(factors => {
      // Recorremos cada factor para asegurarnos de que no exceda los 1000 caracteres
      for (const factor of factors) {
        if (factor.length > 1000) {
          throw new Error(`Some factor name exceeds the maximum length of 1000 characters.`);
        }
      }
      return true;  // Si todo está bien, devuelve true para continuar
    }),
];

module.exports = organizationsValidator;
