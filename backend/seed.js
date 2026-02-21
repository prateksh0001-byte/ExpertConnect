require('dotenv').config();
const mongoose = require('mongoose');
const Expert = require('./models/Expert');

const generateSlots = () => {
  const slots = [];
  const today = new Date();
  const times = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  for (let d = 1; d <= 14; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends
    const dateStr = date.toISOString().split('T')[0];
    times.forEach((time) => {
      slots.push({ date: dateStr, time, isBooked: false });
    });
  }
  return slots;
};

const experts = [
  {
    name: 'Dr. Sarah Chen',
    category: 'Technology',
    bio: 'Senior AI/ML Engineer at Google with 12 years of experience building production ML systems. Specializes in deep learning, NLP, and computer vision.',
    experience: 12,
    rating: 4.9,
    reviewCount: 284,
    hourlyRate: 250,
    skills: ['Machine Learning', 'Python', 'TensorFlow', 'NLP', 'Computer Vision'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Marcus Thompson',
    category: 'Finance',
    bio: 'CFA-certified financial advisor with expertise in portfolio management, tax optimization, and retirement planning for tech professionals.',
    experience: 15,
    rating: 4.8,
    reviewCount: 192,
    hourlyRate: 300,
    skills: ['Portfolio Management', 'Tax Planning', 'Retirement', 'Investments', 'Crypto'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Dr. Priya Sharma',
    category: 'Health',
    bio: 'Board-certified physician and functional medicine specialist. Helps high-performing professionals optimize their health for peak performance.',
    experience: 10,
    rating: 4.9,
    reviewCount: 341,
    hourlyRate: 200,
    skills: ['Functional Medicine', 'Nutrition', 'Sleep Optimization', 'Stress Management', 'Hormones'],
    availableSlots: generateSlots(),
  },
  {
    name: 'James Whitfield',
    category: 'Legal',
    bio: 'Corporate attorney specializing in startup law, IP protection, and contract negotiation. Former partner at Morrison & Foerster.',
    experience: 18,
    rating: 4.7,
    reviewCount: 156,
    hourlyRate: 400,
    skills: ['Startup Law', 'IP Protection', 'Contract Negotiation', 'Employment Law', 'Equity'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Aisha Okonkwo',
    category: 'Marketing',
    bio: 'Growth marketing expert who has scaled 3 startups from $0 to $10M+ ARR. Expert in performance marketing, SEO, and brand strategy.',
    experience: 9,
    rating: 4.8,
    reviewCount: 217,
    hourlyRate: 175,
    skills: ['Growth Marketing', 'SEO', 'Paid Ads', 'Brand Strategy', 'Content Marketing'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Liam Novak',
    category: 'Design',
    bio: 'Product design lead with experience at Apple and Airbnb. Creates user experiences that drive engagement and conversion.',
    experience: 11,
    rating: 4.9,
    reviewCount: 198,
    hourlyRate: 225,
    skills: ['Product Design', 'UX Research', 'Design Systems', 'Figma', 'Prototyping'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Elena Rodriguez',
    category: 'Business',
    bio: 'Executive coach and business strategy consultant. Former McKinsey consultant who has helped 50+ companies scale from startup to enterprise.',
    experience: 14,
    rating: 4.7,
    reviewCount: 143,
    hourlyRate: 350,
    skills: ['Business Strategy', 'Executive Coaching', 'OKRs', 'Team Building', 'Fundraising'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Prof. Daniel Kim',
    category: 'Education',
    bio: 'Stanford-trained educator and curriculum designer. Specializes in helping professionals transition into tech and upskilling engineering teams.',
    experience: 13,
    rating: 4.8,
    reviewCount: 267,
    hourlyRate: 150,
    skills: ['Career Transition', 'Curriculum Design', 'Coding Bootcamp', 'Mentorship', 'Leadership'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Rachel Park',
    category: 'Technology',
    bio: 'Cloud architecture specialist (AWS/GCP certified) with expertise in building scalable distributed systems and DevOps transformation.',
    experience: 8,
    rating: 4.6,
    reviewCount: 89,
    hourlyRate: 200,
    skills: ['AWS', 'GCP', 'Kubernetes', 'Terraform', 'System Design'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Omar Hassan',
    category: 'Finance',
    bio: 'Venture capital advisor and angel investor with 50+ investments. Helps founders navigate fundraising, term sheets, and investor relations.',
    experience: 16,
    rating: 4.8,
    reviewCount: 112,
    hourlyRate: 500,
    skills: ['Venture Capital', 'Fundraising', 'Term Sheets', 'Pitch Decks', 'Due Diligence'],
    availableSlots: generateSlots(),
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expert-booking');
    console.log('Connected to MongoDB');
    await Expert.deleteMany({});
    await Expert.insertMany(experts);
    console.log(`✅ Seeded ${experts.length} experts`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
