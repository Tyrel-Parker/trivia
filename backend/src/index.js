require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const factsRoutes = require('./routes/facts');
const profilesRoutes = require('./routes/profiles');
const dismissRoutes = require('./routes/dismiss');
const { startScheduler } = require('./scheduler');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/facts', factsRoutes);
app.use('/profiles', profilesRoutes);
app.use('/dismiss', dismissRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  startScheduler();
});
