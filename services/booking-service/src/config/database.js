'use strict';

const mongoose = require('mongoose');

/**
 * Connexion Mongoose unique vers MongoDB (booking_db).
 * URI injectée via la variable d'env MONGO_URI (docker-compose).
 */
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://root:root@mongodb:27017/booking_db?authSource=admin';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('🟢 MongoDB connecté avec succès pour Booking Service');
    return mongoose.connection;
  } catch (err) {
    console.error('🔴 Erreur connexion MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB, MONGO_URI };

