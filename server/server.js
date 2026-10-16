require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const responseTime = require('./middleware/responseTime');

// JWT_SECRET must come from .env - never hardcode it
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in .env');
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('FATAL: MONGO_URI is not set in .env');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(responseTime); // Practical 9: X-Response-Time header + request log

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// Practical 9: cache hit/miss counters + toggle (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', require('./routes/debugRoutes'));
}

// Production: serve the built React app (client/dist) with SPA fallback
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use('/api', notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
});
