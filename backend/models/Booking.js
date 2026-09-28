const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expert',
      required: true,
    },
    expertName: { type: String, required: true },
    clientName: { type: String, required: true, trim: true },
    clientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    clientPhone: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    timeSlot: { type: String, required: true }, // "HH:MM"
    notes: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

bookingSchema.set('autoIndex', false);

bookingSchema.index(
  { expertId: 1, date: 1, timeSlot: 1 },
  {
    name: 'active_booking_slot_unique',
    unique: true,
    partialFilterExpression: { status: { $in: ['Pending', 'Confirmed', 'Completed'] } },
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
