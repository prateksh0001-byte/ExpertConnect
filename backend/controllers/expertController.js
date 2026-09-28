const Expert = require('../models/Expert');
const Booking = require('../models/Booking');

// GET /api/experts
exports.getExperts = async (req, res, next) => {
  try {
    const { search, category, sortBy, page = 1, limit = 8 } = req.query;
    const query = {};

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { bio: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
        { skills: { $elemMatch: { $regex: term, $options: 'i' } } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    let sort = { rating: -1 };
    if (sortBy === 'price_low') sort = { hourlyRate: 1 };
    else if (sortBy === 'price_high') sort = { hourlyRate: -1 };
    else if (sortBy === 'experience') sort = { experience: -1 };
    else if (sortBy === 'reviews') sort = { reviewCount: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Expert.countDocuments(query);
    const experts = await Expert.find(query)
      .select('-availableSlots')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: experts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)) || 1,
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/experts/stats
exports.getStats = async (req, res, next) => {
  try {
    const totalExperts = await Expert.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const experts = await Expert.find({}).select('rating hourlyRate category');

    const avgRating = experts.length
      ? (experts.reduce((acc, curr) => acc + (curr.rating || 4.8), 0) / experts.length).toFixed(1)
      : '4.9';

    const categories = [...new Set(experts.map(e => e.category))];

    res.json({
      success: true,
      data: {
        totalExperts,
        totalBookings,
        avgRating,
        categoriesCount: categories.length,
        categories,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/experts/:id
exports.getExpertById = async (req, res, next) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }
    res.json({ success: true, data: expert });
  } catch (err) {
    next(err);
  }
};
