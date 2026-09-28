const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  createBooking,
  getBookingsByEmail,
  getBookingById,
  updateBookingStatus,
} = require('../controllers/bookingController');

const bookingValidation = [
  body('expertId').notEmpty().withMessage('Expert ID is required'),
  body('clientName').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('clientEmail').isEmail().withMessage('Valid email is required').customSanitizer((v) => v.toLowerCase().trim()),
  body('clientPhone').trim().notEmpty().withMessage('Phone is required').matches(/^[+]?[\d\s\-().]{7,20}$/).withMessage('Invalid phone number'),
  body('date').notEmpty().withMessage('Date is required').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be YYYY-MM-DD'),
  body('timeSlot').notEmpty().withMessage('Time slot is required').matches(/^\d{2}:\d{2}$/).withMessage('Time must be HH:MM'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  next();
};

router.post('/', bookingValidation, validate, createBooking);
router.get('/', getBookingsByEmail);
router.get('/:id', getBookingById);
router.patch('/:id/status', updateBookingStatus);

module.exports = router;
