'use strict';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  CONTRÔLEUR MÉTIER : reservationController.js
 *  Microservice : booking-service (Node.js / Express + MongoDB)
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 *  Rôle principal :
 *  Gestion complète du cycle de vie des réservations touristiques :
 *  - Recherche souple (par MongoDB _id ou par ID numérique).
 *  - Filtrage dynamique pour la page "Mes Réservations" du client connecté.
 *  - Calcul automatique du tarif total (nuits, pension, âges des enfants).
 *  - Modification des statuts (en_attente, confirmee, annulee) pour l'Admin.
 */

const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const { calculatePrixTotal } = require('../utils/priceCalculator');

/**
 * ── FONCTIONS HELPERS (UTILITAIRES INTERNES) ─────────────────────────────────
 */

/**
 * HELPER 1 : findByIdParam
 * Rôle : Permet de retrouver une réservation de manière transparente,
 *        que la requête utilise un _id MongoDB (ex: '6a71149e...')
 *        ou un ID numérique classique (ex: 1, 2, 9).
 */
async function findByIdParam(id) {
  let booking = null;
  // 1. Si l'identifiant est une clé valide MongoDB ObjectId (24 caractères hexadécimaux)
  if (mongoose.Types.ObjectId.isValid(id)) {
    booking = await Reservation.findById(id);
  }
  // 2. Si ce n'est pas un ObjectId mais un nombre, on cherche par le champ numérique `id`
  if (!booking && !Number.isNaN(+id)) {
    booking = await Reservation.findOne({ id: +id });
  }
  return booking;
}

/**
 * HELPER 2 : nextLegacyId
 * Rôle : Génère automatiquement le prochain identifiant numérique métier (1, 2, 3...)
 *        pour garantir la rétro-compatibilité avec le tableau de bord Admin.
 */
async function nextLegacyId() {
  const lastDoc = await Reservation.findOne().sort({ id: -1 });
  return lastDoc && lastDoc.id ? lastDoc.id + 1 : 1;
}

/**
 * ── CONTRÔLEURS DE ROUTES (ENDPOINTS API REST) ──────────────────────────────
 */

/**
 * FONCTION 1 : health
 * Route : GET /health
 * Rôle  : Endpoint de vérification de santé utilisé par le serveur Eureka
 *         et l'API Gateway Nginx pour tester si le microservice est en ligne (UP).
 */
exports.health = (_req, res) => {
  res.json({
    service: 'booking-service',
    framework: 'Node.js / Express + MongoDB',
    status: 'UP 🟢',
  });
};

/**
 * FONCTION 2 : index
 * Route : GET /
 * Rôle  : Récupère la totalité des réservations enregistrées dans MongoDB.
 *         Utilisé principalement par le Dashboard Administrateur pour la gestion globale.
 *         Trie les réservations de la plus récente à la plus ancienne (createdAt: -1).
 */
exports.index = async (_req, res, next) => {
  try {
    const bookings = await Reservation.find().sort({ createdAt: -1 });
    // Applique .format() pour renvoyer des sous-objets propre (hotel, user, chambre)
    res.json(bookings.map((b) => b.format()));
  } catch (err) {
    next(err);
  }
};

/**
 * FONCTION 3 : mesReservations
 * Route : GET /mes-reservations?email=...
 * Rôle  : Filtre dynamiquement les réservations dans MongoDB pour la page "Mes Réservations".
 *         Récupère l'email de l'utilisateur connecté via le Jeton Keycloak SSO
 *         et renvoie uniquement ses cartes de réservations personnelles.
 */
exports.mesReservations = async (req, res, next) => {
  try {
    const { user_id, email, user_email, name, user_nom } = req.query;
    let query = {};

    // Priorité 1 : Filtrage par Email (Keycloak Token)
    if (email || user_email) {
      query = { user_email: (email || user_email).toLowerCase().trim() };
    }
    // Priorité 2 : Filtrage par ID numérique
    else if (user_id && !Number.isNaN(+user_id)) {
      query = { user_id: +user_id };
    }
    // Priorité 3 : Filtrage par Nom complet
    else if (name || user_nom) {
      query = { user_nom: name || user_nom };
    }

    const bookings = await Reservation.find(query).sort({ createdAt: -1 });
    res.json(bookings.map((b) => b.format()));
  } catch (err) {
    next(err);
  }
};

/**
 * FONCTION 4 : byUser
 * Route : GET /user/:userId
 * Rôle  : Récupère la liste des réservations associées à un ID utilisateur spécifique.
 */
exports.byUser = async (req, res, next) => {
  try {
    const userId = +req.params.userId;
    const bookings = await Reservation.find({ user_id: userId }).sort({ createdAt: -1 });
    res.json(bookings.map((b) => b.format()));
  } catch (err) {
    next(err);
  }
};

/**
 * FONCTION 5 : show
 * Route : GET /:id
 * Rôle  : Affiche le détail complet d'une seule réservation spécifique par son ID.
 */
exports.show = async (req, res, next) => {
  try {
    const booking = await findByIdParam(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation introuvable.' });
    }
    res.json(booking.format());
  } catch (err) {
    next(err);
  }
};

/**
 * FONCTION 6 : store
 * Route : POST /
 * Rôle  : Crée et enregistre une nouvelle réservation dans la base MongoDB.
 *         - Récupère le Snapshot des données de l'hôtel et de l'utilisateur.
 *         - Calcule le prix total automatiquement selon le nombre de nuits, la pension
 *           et l'âge des enfants.
 *         - Définit le statut initial sur 'en_attente'.
 */
exports.store = async (req, res, next) => {
  try {
    const {
      user_id, user_nom, user_email,
      hotel_id, hotel_nom, hotel_image, destination_nom,
      chambre_id, chambre_nom, prix_base_nuit,
      pension_id, pension_nom, supplement_pension,
      date_arrivee, date_depart,
      nb_chambres, nb_adultes, nb_enfants, ages_enfants,
      prix_total,
    } = req.body;

    // Validation minimale des champs obligatoires
    if (!hotel_id || !date_arrivee || !date_depart) {
      return res.status(422).json({
        message: 'Les champs hotel_id, date_arrivee et date_depart sont obligatoires.',
      });
    }

    // Calcul automatique du prix total si non fourni
    const calculatedPrix =
      prix_total ||
      calculatePrixTotal({
        prixBaseNuit: prix_base_nuit || 120,
        supplementPension: supplement_pension || 0,
        agesEnfants: ages_enfants || [],
        dateArrivee: date_arrivee,
        dateDepart: date_depart,
        nbChambres: nb_chambres || 1,
      });

    // Construction du document Mongoose (Snapshot)
    const newBooking = new Reservation({
      id: await nextLegacyId(),
      user_id: user_id || 1,
      user_nom: user_nom || 'Client TunisieBooking',
      user_email: user_email || 'client@gmail.com',
      hotel_id: +hotel_id,
      hotel_nom: hotel_nom || 'Hôtel TunisieBooking',
      hotel_image: hotel_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
      destination_nom: destination_nom || 'Tunisie',
      chambre_id: chambre_id ? +chambre_id : undefined,
      chambre_nom: chambre_nom || 'Chambre Standard',
      pension_id: pension_id ? +pension_id : undefined,
      pension_nom: pension_nom || 'Petit Déjeuner',
      date_arrivee,
      date_depart,
      nb_chambres: nb_chambres || 1,
      nb_adultes: nb_adultes || 2,
      nb_enfants: nb_enfants || 0,
      ages_enfants: ages_enfants || [],
      prix_total: calculatedPrix,
      statut: 'en_attente',
    });

    // Enregistrement effectif dans la collection MongoDB
    await newBooking.save();
    res.status(201).json(newBooking.format());
  } catch (err) {
    next(err);
  }
};

/**
 * FONCTION 7 : update
 * Route : PUT /:id
 * Rôle  : Permet la mise à jour d'une réservation (ex: modification du statut par l'Admin).
 *         Statuts autorisés : 'en_attente', 'confirmee', 'annulee'.
 */
exports.update = async (req, res, next) => {
  try {
    const { statut } = req.body;

    // Contrôle de validité du statut
    if (statut && !['en_attente', 'confirmee', 'annulee'].includes(statut)) {
      return res.status(422).json({
        message: 'Statut invalide. Choisir entre: en_attente, confirmee, annulee.',
      });
    }

    let booking = null;
    // Recherche et mise à jour dans MongoDB
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      booking = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    }
    if (!booking && !Number.isNaN(+req.params.id)) {
      booking = await Reservation.findOneAndUpdate({ id: +req.params.id }, req.body, { new: true });
    }

    if (!booking) {
      return res.status(404).json({ message: 'Réservation introuvable.' });
    }

    res.json(booking.format());
  } catch (err) {
    next(err);
  }
};

/**
 * FONCTION 8 : destroy
 * Route : DELETE /:id
 * Rôle  : Supprime définitivement une réservation de la base de données MongoDB.
 */
exports.destroy = async (req, res, next) => {
  try {
    let deleted = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      deleted = await Reservation.findByIdAndDelete(req.params.id);
    }
    if (!deleted && !Number.isNaN(+req.params.id)) {
      deleted = await Reservation.findOneAndDelete({ id: +req.params.id });
    }

    if (!deleted) {
      return res.status(404).json({ message: 'Réservation introuvable.' });
    }

    res.json({ message: 'Réservation supprimée avec succès.' });
  } catch (err) {
    next(err);
  }
};
