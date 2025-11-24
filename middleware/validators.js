// middleware/validators.js
const { check, validationResult } = require('express-validator');

const userRegisterValidation = [
  check('username').notEmpty().withMessage('Username is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  userRegisterValidation,
  validate
};
