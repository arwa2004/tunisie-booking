'use strict';

const express = require('express');
const { connectDB } = require('./src/config/database');
const { seedInitialBookings } = require('./src/seed/seedData');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');
const reservationRoutes = require('./src/routes/reservationRoutes');

const app = express();

// Body parsing JSON
app.use(express.json());

// Note: CORS est géré par Nginx (api-gateway) — aucun header CORS en double ici.

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/', reservationRoutes);

// ── Gestion centralisée des erreurs ─────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Démarrage : connexion Mongo puis seed puis serveur ──────────────────────
const PORT = process.env.PORT || 8000;

connectDB()
  .then(async () => {
    await seedInitialBookings();
    app.listen(PORT, () =>
      console.log(`🚀 Booking Service (Node.js/MongoDB) running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('🔴 Impossible de démarrer le booking-service:', err.message);
    process.exit(1);
  });
