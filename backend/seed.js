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
    bio: 'Senior AI/ML Principal Engineer with 12+ years experience building production LLMs and computer vision at scale. Advised 40+ startups on AI strategy.',
    experience: 12,
    rating: 4.95,
    reviewCount: 284,
    hourlyRate: 250,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=360',
    skills: ['Machine Learning', 'Python', 'TensorFlow', 'LLMs', 'Computer Vision', 'PyTorch'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Marcus Thompson',
    category: 'Finance',
    bio: 'CFA-certified wealth strategist and former hedge fund partner. Specializes in tax-advantaged portfolio architecture and executive equity.',
    experience: 15,
    rating: 4.88,
    reviewCount: 192,
    hourlyRate: 300,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=360',
    skills: ['Portfolio Management', 'Tax Planning', 'Retirement', 'Investments', 'Crypto', 'Equity Optimization'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Dr. Priya Sharma',
    category: 'Health',
    bio: 'Board-certified physician and longevity specialist. Designs personalized circadian, biomarker, and nutrition regimens for high performers.',
    experience: 10,
    rating: 4.97,
    reviewCount: 341,
    hourlyRate: 200,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=360',
    skills: ['Functional Medicine', 'Nutrition', 'Sleep Optimization', 'Biomarkers', 'Stress Management'],
    availableSlots: generateSlots(),
  },
  {
    name: 'James Whitfield',
    category: 'Legal',
    bio: 'Venture & startup corporate attorney. Managed 100+ Series A-D financings, SAFE notes, IP portfolios, and M&A transactions in Silicon Valley.',
    experience: 18,
    rating: 4.79,
    reviewCount: 156,
    hourlyRate: 400,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=360',
    skills: ['Startup Law', 'IP Protection', 'Contract Negotiation', 'Series A/B/C', 'Cap Table Management'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Aisha Okonkwo',
    category: 'Marketing',
    bio: 'Growth marketing director who scaled 3 B2B/B2C tech startups from $0 to $25M+ ARR. Mastery over paid acquisition, organic virality, and CAC/LTV.',
    experience: 9,
    rating: 4.86,
    reviewCount: 217,
    hourlyRate: 175,
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=360',
    skills: ['Growth Marketing', 'SEO', 'Paid Social', 'Brand Strategy', 'Product-Led Growth'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Liam Novak',
    category: 'Design',
    bio: 'Principal Product Designer, formerly leading design systems at Apple & Airbnb. Obsessed with micro-interactions, conversion UX, and typography.',
    experience: 11,
    rating: 4.93,
    reviewCount: 198,
    hourlyRate: 225,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=360',
    skills: ['Product Design', 'UX Research', 'Design Systems', 'Figma', 'Prototyping', 'Design Tokens'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Elena Rodriguez',
    category: 'Business',
    bio: 'Executive coach and leadership advisor. Former McKinsey engagement director helping founders build cohesive C-suites and operational velocity.',
    experience: 14,
    rating: 4.78,
    reviewCount: 143,
    hourlyRate: 350,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=360',
    skills: ['Business Strategy', 'Executive Coaching', 'OKRs', 'Team Scaling', 'Fundraising Prep'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Prof. Daniel Kim',
    category: 'Education',
    bio: 'Stanford-trained educator & technical curriculum lead. Mentored over 1,500 engineers transitioning into tech and distributed systems careers.',
    experience: 13,
    rating: 4.84,
    reviewCount: 267,
    hourlyRate: 150,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=360',
    skills: ['Career Transition', 'Curriculum Design', 'System Architecture', 'Mentorship', 'Engineering Leadership'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Rachel Park',
    category: 'Technology',
    bio: 'Multi-cloud solutions architect (AWS/GCP Certified Fellow). Specializes in zero-downtime migrations, Kubernetes clusters, and microservices.',
    experience: 8,
    rating: 4.72,
    reviewCount: 89,
    hourlyRate: 200,
    avatar: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80&w=360',
    skills: ['AWS', 'GCP', 'Kubernetes', 'Terraform', 'System Design', 'DevOps'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Omar Hassan',
    category: 'Finance',
    bio: 'General Partner at Horizon Capital with 50+ early-stage angel investments. Master at pitching mechanics, valuation models, and investor syndicate dynamics.',
    experience: 16,
    rating: 4.91,
    reviewCount: 112,
    hourlyRate: 500,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=360',
    skills: ['Venture Capital', 'Fundraising', 'Term Sheets', 'Pitch Decks', 'Due Diligence'],
    availableSlots: generateSlots(),
  },
];

const seed = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/expert-booking';
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB for seeding');
    }
    await Expert.deleteMany({});
    await Expert.insertMany(experts);
    console.log(`✅ Seeded ${experts.length} experts with realistic avatars and slots`);
    if (require.main === module) {
      process.exit(0);
    }
  } catch (err) {
    console.error('Seed error:', err);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
};

if (require.main === module) {
  seed();
}

module.exports = { seed, experts, generateSlots };
