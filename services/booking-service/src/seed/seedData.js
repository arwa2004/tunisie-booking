'use strict';

const Reservation = require('../models/Reservation');

/**
 * Données initiales de démonstration (3 réservations),
 * insérées automatiquement si la collection est vide.
 */
const initialReservations = [
  {
    id: 1,
    user_id: 1,
    user_nom: 'Arwa Ben Amar',
    user_email: 'arwa@tunisiebooking.tn',
    hotel_id: 1,
    hotel_nom: 'El Mouradi El Menzah (Hammamet)',
    hotel_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
    destination_nom: 'Hammamet',
    chambre_id: 14,
    chambre_nom: 'Chambre Double Standard',
    pension_id: 2,
    pension_nom: 'Demi Pension',
    date_arrivee: '2026-08-10',
    date_depart: '2026-08-13',
    nb_chambres: 1,
    nb_adultes: 2,
    nb_enfants: 1,
    ages_enfants: [6],
    prix_total: 570,
    statut: 'confirmee',
  },
  {
    id: 2,
    user_id: 2,
    user_nom: 'Client Test',
    user_email: 'client@gmail.com',
    hotel_id: 3,
    hotel_nom: 'Hasdrubal Prestige Thalassa & Spa (Djerba)',
    hotel_image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500',
    destination_nom: 'Djerba',
    chambre_id: 24,
    chambre_nom: 'Chambre Double Standard',
    pension_id: 4,
    pension_nom: 'All Inclusive',
    date_arrivee: '2026-08-15',
    date_depart: '2026-08-18',
    nb_chambres: 1,
    nb_adultes: 2,
    nb_enfants: 0,
    ages_enfants: [],
    prix_total: 1650,
    statut: 'en_attente',
  },
  {
    id: 3,
    user_id: 1,
    user_nom: 'Arwa Ben Amar',
    user_email: 'arwa@tunisiebooking.tn',
    hotel_id: 5,
    hotel_nom: 'Mövenpick Resort & Marine Spa (Sousse)',
    hotel_image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500',
    destination_nom: 'Sousse',
    chambre_id: 44,
    chambre_nom: 'Chambre Double Vue Mer',
    pension_id: 3,
    pension_nom: 'All Inclusive Soft',
    date_arrivee: '2026-09-01',
    date_depart: '2026-09-05',
    nb_chambres: 1,
    nb_adultes: 2,
    nb_enfants: 2,
    ages_enfants: [5, 10],
    prix_total: 1640,
    statut: 'confirmee',
  },
];

/**
 * Insère les 3 réservations de démo si la collection est vide.
 * Appelée au démarrage du service.
 */
async function seedInitialBookings() {
  try {
    const count = await Reservation.countDocuments();
    if (count === 0) {
      console.log('🌱 Population initiale de la base MongoDB booking_db...');
      await Reservation.insertMany(initialReservations);
      console.log('✅ 3 réservations de démonstration ajoutées dans MongoDB !');
    }
  } catch (e) {
    console.error('Erreur seed booking:', e.message);
  }
}

module.exports = { seedInitialBookings, initialReservations };

