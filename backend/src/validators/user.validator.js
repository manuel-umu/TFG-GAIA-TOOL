const { body } = require('express-validator');

const usersValidator = [

  body('username')
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 3, max: 70 }).withMessage('Username must be at least 3 characters.'),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 5, max: 200 }).withMessage('Password must be at least 5 characters and one digit.')
    .matches(/\d/).withMessage('Password must be at least 5 characters and one digit.'),

  body('name')
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 3, max: 70 }).withMessage('Name must be between 3 and 70 characters.'),

  body('email')
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .isLength({ max: 100 }).withMessage('Email must be at most 50 characters long.'),

  body('role')
    .optional()
    .isIn(['admin', 'evaluator_auditor', 'chief_auditor']).withMessage('Role is invalid.'),
];

module.exports = usersValidator;