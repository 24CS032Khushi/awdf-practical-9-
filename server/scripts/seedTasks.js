/**
 * Adds sample tasks for a user so the cache benefit is measurable
 * (a tiny dataset makes MongoDB so fast that cached vs uncached looks identical).
 *
 *   node scripts/seedTasks.js you@example.com 500
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');

(async () => {
  const [email, countArg] = process.argv.slice(2);
  const count = Number(countArg) || 500;
  if (!email) {
    console.error('Usage: node scripts/seedTasks.js <user-email> [count=500]');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error(`No user with email ${email}. Register first via POST /api/auth/register.`);
    process.exit(1);
  }
  const statuses = ['pending', 'in-progress', 'completed'];
  const docs = Array.from({ length: count }, (_, i) => ({
    title: `Sample task ${i + 1}`,
    description: 'Seeded for Practical 9 cache measurements. '.repeat(4).slice(0, 200),
    status: statuses[i % 3],
    user: user._id,
  }));
  await Task.insertMany(docs);
  console.log(`Inserted ${count} tasks for ${email}. Total now: ${await Task.countDocuments({ user: user._id })}`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
