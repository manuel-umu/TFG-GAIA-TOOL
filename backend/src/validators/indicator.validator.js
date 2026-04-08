const { body } = require('express-validator');

const indicatorsValidator = [
  
  body('name')
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 1, max: 200 }).withMessage('Name must be at most 200 characters long.'),

  body('dimension')
    .notEmpty().withMessage('Dimension is required.')
    .isLength({ min: 1, max: 100 }).withMessage('Dimension must be at most 100 characters long.'),

  body('formula')
    .notEmpty().withMessage('Formula is required.')
    .isLength({ min: 1, max: 1000 }).withMessage('Formula must be at most 1000 characters long.'),

  body('goal')
    .notEmpty().withMessage('Goal is required.')
    .custom(value => {
      const allowed = ['maximize', 'minimize'];
      if (!allowed.includes(value.toLowerCase())) {
        throw new Error('Goal must be either "maximize" or "minimize".');
      }
      return true;
    }),

  body('measure')
    .notEmpty().withMessage('Measure is required.')
    .isLength({ min: 1, max: 80 }).withMessage('Measurement units must be at most 80 characters long.'),

  body('frequency')
    .notEmpty().withMessage('Frequency is required.'),
];

module.exports = indicatorsValidator;
