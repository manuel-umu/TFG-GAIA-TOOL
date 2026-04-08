const { body } = require('express-validator');

const processesValidator = [

    body('name')
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 3, max: 70 }).withMessage('Name must be between 3 and 70 characters.'),

    body('type')
    .notEmpty().withMessage('Type is required.'),

    body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description must be at most 500 characters long.'),

    body('responsible')
    .notEmpty().withMessage('Responsible is required.')
    .isInt({ min: 1 }).withMessage('Responsible must be a positive integer.'),

];

module.exports = processesValidator;