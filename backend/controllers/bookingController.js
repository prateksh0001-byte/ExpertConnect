const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Expert = require('../models/Expert');

// POST /api/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const { expertId, clientName, clientEmail, clientPhone, date, timeSlot, notes } = req.body;

    // Find expert and slot
    const expert = await Expert.findOne({
      _id: expertId,
      'availableSlots.date': date,
      'availableSlots.time': timeSlot,
      'availableSlots.isBooked': false,
    });

    if (!expert) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is no longer available. Please choose another slot.',
      });
    }

    // Create booking first (unique index prevents race condition double-booking)
    const booking = await Booking.create({
      expertId,
      expertName: expert.name,
      clientName,
      clientEmail,
      clientPhone,
      date,
      timeSlot,
      notes: notes || '',
    });

    // Mark slot as booked
    await Expert.updateOne(
      {
        _id: expertId,
        'availableSlots.date': date,
        'availableSlots.time': timeSlot,
      },
      { $set: { 'availableSlots.$.isBooked': true } }
    );

    // Emit real-time update
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
    // Duplicate key error = race condition caught
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
    const bookings = await Booking.find({ clientEmail: email.toLowerCase() }).sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
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

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // If cancelled, free up the slot
    if (status === 'Cancelled') {
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

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};
