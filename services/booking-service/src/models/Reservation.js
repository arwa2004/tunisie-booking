'use strict';

const mongoose = require('mongoose');

/**
 * Schéma Mongoose — Réservation TunisieBooking
 * Reproduit le modèle métier Laravel en base MongoDB.
 */
const reservationSchema = new mongoose.Schema(
  {
    // Identifiants & utilisateur
    id:              { type: Number },
    user_id:         { type: Number, required: true, default: 1 },
    user_nom:        { type: String, default: 'Client TunisieBooking' },
    user_email:      { type: String, lowercase: true, default: 'client@gmail.com' },

    // Hôtel
    hotel_id:        { type: Number, required: true },
    hotel_nom:       { type: String, default: 'Hôtel TunisieBooking' },
    hotel_image:     { type: String },
    destination_nom: { type: String, default: 'Tunisie' },

    // Chambre
    chambre_id:      { type: Number },
    chambre_nom:     { type: String, default: 'Chambre Double Standard' },

    // Pension
    pension_id:      { type: Number },
    pension_nom:     { type: String, default: 'Demi Pension' },

    // Dates
    date_arrivee:    { type: String, required: true },
    date_depart:     { type: String, required: true },

    // Occupants
    nb_chambres:     { type: Number, default: 1 },
    nb_adultes:      { type: Number, default: 2 },
    nb_enfants:      { type: Number, default: 0 },
    ages_enfants:    { type: [Number], default: [] },

    // Tarification
    prix_total:      { type: Number, required: true },

    // Statut
    statut: {
      type: String,
      enum: ['en_attente', 'confirmee', 'annulee'],
      default: 'en_attente',
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

/**
 * Transforme un document brut en réponse API compatible
 * avec les interfaces Laravel & Next.js (objets `hotel`, `user`, `chambre`, `pension` imbriqués).
 */
reservationSchema.methods.format = function format() {
  const obj = this.toObject();

  // Décompose user_nom ("Prenom Nom") en prenom/nom pour l'interface du dashboard admin.
  const fullName = (obj.user_nom || 'Client TunisieBooking').trim();
  const parts = fullName.split(' ');
  const prenom = parts.slice(0, -1).join(' ') || fullName;
  const nom = parts.length > 1 ? parts[parts.length - 1] : '';

  return {
    ...obj,
    hotel: {
      id: obj.hotel_id,
      nom: obj.hotel_nom,
      image:
        obj.hotel_image ||
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
      destination: obj.destination_nom ? { id: null, nom: obj.destination_nom } : null,
    },
    user: {
      id: obj.user_id,
      nom,
      prenom,
      email: obj.user_email,
    },
    chambre: obj.chambre_id
      ? { id: obj.chambre_id, nom: obj.chambre_nom || 'Chambre Double Standard' }
      : null,
    pension: obj.pension_id
      ? { id: obj.pension_id, nom: obj.pension_nom || 'Demi Pension' }
      : null,
  };
};

module.exports = mongoose.model('Reservation', reservationSchema);

