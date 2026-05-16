const { body } = require('express-validator');

const auditsValidator = [

  body('name')
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters.'),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description must be at most 500 characters long.'),

  body('auditor')
    .notEmpty().withMessage('Auditor is required.')
    .isInt().withMessage('Auditor ID must be an integer.'),

  body('manager')
    .notEmpty().withMessage('Manager is required.')
    .isInt().withMessage('Manager ID must be an integer.'),

  body('init_date')
    .notEmpty().withMessage('Start date is required.')
    .isISO8601().withMessage('Start date must be a valid date in ISO 8601 format.')
    .toDate()
    .custom(initDate => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (initDate < today) {
        throw new Error('Start date cannot be in the past.');
      }
      return true;
    }),

  body('end_date')
    .notEmpty().withMessage('End date is required.')
    .isISO8601().withMessage('End date must be a valid date in ISO 8601 format.')
    .toDate()
    .custom((endDate, { req }) => {
      const initDate = new Date(req.body.init_date);
      if (endDate <= initDate) {
        throw new Error('End date must be after the start date.');
      }
      return true;
    }),

  body('frequency')
    .notEmpty().withMessage('Frequency is required.')
    .isLength({ max: 50 }).withMessage('Frequency must be at most 50 characters long.'),

  body('state')
    .notEmpty().withMessage('State is required.')
    .isLength({ max: 50 }).withMessage('State must be at most 50 characters long.'),

  body('organization')
    .notEmpty().withMessage('Organization is required.')
    .isInt().withMessage('Organization ID must be an integer.'),

  body('reporting_year')
    .optional({ checkFalsy: true })
    .isInt({ min: 2000, max: 2100 }).withMessage('Reporting year must be a year between 2000 and 2100.')
];

module.exports = auditsValidator;

