'use strict';

/**
 * Gestion centralisée des erreurs Express.
 * - 404 pour les routes inconnues
 * - 500 (ou code fourni) pour les erreurs applicatives
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    message: 'Route introuvable sur le booking-service.',
    path: req.originalUrl,
  });
}

function errorHandler(err, req, res, _next) {
  console.error(`🔴 [Booking-Service] Erreur sur ${req.method} ${req.originalUrl}:`, err.message);

  const status = err.status || err.statusCode || 500;

  if (err.name === 'ValidationError') {
    return res.status(422).json({
      message: 'Erreur de validation.',
      errors: Object.keys(err.errors).reduce((acc, key) => {
        acc[key] = err.errors[key].message;
        return acc;
      }, {}),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Identifiant invalide.' });
  }

  res.status(status).json({
    message: err.message || 'Erreur interne du serveur.',
  });
}

module.exports = { notFoundHandler, errorHandler };

