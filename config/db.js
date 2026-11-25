const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Add it to your .env file.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`[database] Connected to MongoDB: ${mongoose.connection.name}`);
}

module.exports = connectDB;
