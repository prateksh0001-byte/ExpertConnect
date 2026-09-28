const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Expert = require('../models/Expert');

// POST /api/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const { expertId, clientName, clientEmail, clientPhone, date, timeSlot, notes } = req.body;

    // Find expert and slot atomically
    const expert = await Expert.findOneAndUpdate(
      {
        _id: expertId,
        availableSlots: { $elemMatch: { date, time: timeSlot, isBooked: false } },
      },
      { $set: { 'availableSlots.$.isBooked': true } },
      { new: true, projection: { name: 1, avatar: 1, category: 1, hourlyRate: 1 } }
    );

    if (!expert) {
      const exists = await Expert.exists({ _id: expertId });
      return res.status(exists ? 409 : 404).json({
        success: false,
        message: exists
          ? 'This time slot is no longer available. Please choose another slot.'
          : 'Expert not found.',
      });
    }

    let booking;
    try {
      booking = await Booking.create({
        expertId,
        expertName: expert.name,
        clientName,
        clientEmail: clientEmail.toLowerCase().trim(),
        clientPhone,
        date,
        timeSlot,
        notes: notes || '',
        status: 'Pending',
      });
    } catch (err) {
      // Revert slot booking if booking document creation fails
      await Expert.updateOne(
        { _id: expertId, availableSlots: { $elemMatch: { date, time: timeSlot, isBooked: true } } },
        { $set: { 'availableSlots.$.isBooked': false } }
      );
      throw err;
    }

    // Emit real-time update to expert room
    const io = req.app.get('io');
    if (io) {
      io.to(`expert-${expertId}`).emit('slot-booked', {
        expertId,
        date,
        timeSlot,
        bookingId: booking._id,
      });
    }

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot was just booked by someone else. Please choose another slot.',
      });
    }
    next(err);
  }
};

// GET /api/bookings?email=
exports.getBookingsByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const bookings = await Booking.find({ clientEmail: email.toLowerCase().trim() })
      .populate('expertId', 'name category avatar hourlyRate rating')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/:id
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('expertId', 'name category avatar hourlyRate rating bio');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/bookings/:id/status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'Cancelled' && status !== 'Cancelled') {
      return res.status(409).json({ success: false, message: 'A cancelled booking cannot be reactivated. Please make a new booking.' });
    }

    const previousStatus = booking.status;
    booking.status = status;
    await booking.save();

    // If cancelled from an active state, free up the slot
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      await Expert.updateOne(
        {
          _id: booking.expertId,
          'availableSlots.date': booking.date,
          'availableSlots.time': booking.timeSlot,
        },
        { $set: { 'availableSlots.$.isBooked': false } }
      );

      const io = req.app.get('io');
      if (io) {
        io.to(`expert-${booking.expertId}`).emit('slot-freed', {
          expertId: booking.expertId,
          date: booking.date,
          timeSlot: booking.timeSlot,
        });
      }
    }

    // Notify the booking owner via a user-specific room (not a global broadcast)
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${booking.clientEmail}`).emit('booking-status-changed', {
        bookingId: booking._id,
        status: booking.status,
      });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};
