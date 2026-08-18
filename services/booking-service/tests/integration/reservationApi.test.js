'use strict';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  TESTS D'INTÉGRATION — API REST Réservations (booking-service)
 *  Framework : Jest + Supertest + Real MongoDB Test Database
 * ══════════════════════════════════════════════════════════════════════════════
 *
 *  Ces tests vérifient la chaîne complète :
 *  Route → Contrôleur → Modèle Mongoose → Base MongoDB de Test
 *
 *  Connexion à la base locale 'booking_test_db' via Docker.
 *  La base de test est vidée avant chaque test (équivalent de RefreshDatabase).
 */

const mongoose = require('mongoose');
const supertest = require('supertest');
const express = require('express');

// Import des composants de l'application
const Reservation = require('../../src/models/Reservation');
const reservationRoutes = require('../../src/routes/reservationRoutes');

let app;
let request;

// ── Setup : Connexion à la base de test locale MongoDB ──────────────────────
beforeAll(async () => {
  // Utilise l'URI locale de test pointant sur la BDD MongoDB Docker
  const testUri = "mongodb://root:root@127.0.0.1:27017/booking_test_db?authSource=admin";
  await mongoose.connect(testUri);

  app = express();
  app.use(express.json());
  app.use('/', reservationRoutes);

  request = supertest(app);
});

// ── Cleanup : Vider la base de test entre chaque test (RefreshDatabase) ─────
afterEach(async () => {
  await Reservation.deleteMany({});
});

// ── Teardown : Fermer la connexion MongoDB ──────────────────────────────────
afterAll(async () => {
  await mongoose.connection.close();
});

// ═══════════════════════════════════════════════════════════════════════════════
//  TESTS D'INTÉGRATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('🏥 Health Check', () => {
  test('GET /health retourne 200 et status UP', async () => {
    const res = await request.get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toContain('UP');
    expect(res.body.service).toBe('booking-service');
  });
});

describe('📋 GET / — Liste des Réservations', () => {
  test('retourne un tableau vide si aucune réservation', async () => {
    const res = await request.get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('retourne toutes les réservations existantes', async () => {
    await Reservation.create([
      { id: 1, hotel_id: 1, hotel_nom: 'El Mouradi', user_email: 'a@test.com', date_arrivee: '2026-08-10', date_depart: '2026-08-12', prix_total: 240 },
      { id: 2, hotel_id: 2, hotel_nom: 'Hasdrubal', user_email: 'b@test.com', date_arrivee: '2026-08-10', date_depart: '2026-08-13', prix_total: 450 },
    ]);

    const res = await request.get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('📝 POST / — Création de Réservation', () => {
  test('crée une réservation valide et retourne 201', async () => {
    const newBooking = {
      hotel_id: 1,
      hotel_nom: 'El Mouradi El Menzah',
      user_nom: 'Arwa Ben Amar',
      user_email: 'arwa@tunisiebooking.tn',
      date_arrivee: '2026-08-10',
      date_depart: '2026-08-13',
      prix_total: 570,
    };

    const res = await request.post('/').send(newBooking);
    expect(res.statusCode).toBe(201);
    expect(res.body.hotel.nom).toBe('El Mouradi El Menzah');
    expect(res.body.user.email).toBe('arwa@tunisiebooking.tn');
    expect(res.body.prix_total).toBe(570);
    expect(res.body.statut).toBe('en_attente');
  });

  test('retourne 422 si hotel_id manquant', async () => {
    const res = await request.post('/').send({
      date_arrivee: '2026-08-10',
      date_depart: '2026-08-12',
    });
    expect(res.statusCode).toBe(422);
  });

  test('retourne 422 si date_arrivee manquante', async () => {
    const res = await request.post('/').send({
      hotel_id: 1,
      date_depart: '2026-08-12',
    });
    expect(res.statusCode).toBe(422);
  });

  test('calcule le prix automatiquement si non fourni', async () => {
    const res = await request.post('/').send({
      hotel_id: 1,
      date_arrivee: '2026-08-10',
      date_depart: '2026-08-12',
      prix_base_nuit: 100,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.prix_total).toBe(200); // 100 × 2 nuits
  });
});

describe('🔍 GET /:id — Détail d\'une Réservation', () => {
  test('retourne le detail d\'une réservation existante', async () => {
    await Reservation.create({
      id: 42,
      hotel_id: 1,
      hotel_nom: 'El Mouradi',
      user_email: 'arwa@test.com',
      date_arrivee: '2026-08-10',
      date_depart: '2026-08-13',
      prix_total: 360,
    });

    const res = await request.get('/42');
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(42);
    expect(res.body.hotel.nom).toBe('El Mouradi');
  });

  test('retourne 404 pour un ID inexistant', async () => {
    const res = await request.get('/99999');
    expect(res.statusCode).toBe(404);
  });
});

describe('👤 GET /mes-reservations — Filtrage par Email', () => {
  test('retourne uniquement les réservations du client connecté', async () => {
    await Reservation.create([
      { id: 1, hotel_id: 1, user_email: 'arwa@test.com', date_arrivee: '2026-08-10', date_depart: '2026-08-12', prix_total: 240 },
      { id: 2, hotel_id: 2, user_email: 'mohamed@test.com', date_arrivee: '2026-08-10', date_depart: '2026-08-13', prix_total: 450 },
      { id: 3, hotel_id: 3, user_email: 'arwa@test.com', date_arrivee: '2026-08-15', date_depart: '2026-08-18', prix_total: 360 },
    ]);

    const res = await request.get('/mes-reservations?email=arwa@test.com');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
    res.body.forEach(b => {
      expect(b.user.email).toBe('arwa@test.com');
    });
  });
});

describe('✏️ PUT /:id — Modification du Statut', () => {
  test('modifie le statut de en_attente → confirmee', async () => {
    await Reservation.create({
      id: 10,
      hotel_id: 1,
      user_email: 'arwa@test.com',
      date_arrivee: '2026-08-10',
      date_depart: '2026-08-13',
      prix_total: 360,
      statut: 'en_attente',
    });

    const res = await request.put('/10').send({ statut: 'confirmee' });
    expect(res.statusCode).toBe(200);
    expect(res.body.statut).toBe('confirmee');
  });

  test('retourne 422 pour un statut invalide', async () => {
    await Reservation.create({
      id: 11,
      hotel_id: 1,
      user_email: 'a@test.com',
      date_arrivee: '2026-08-10',
      date_depart: '2026-08-13',
      prix_total: 360,
    });

    const res = await request.put('/11').send({ statut: 'invalide_statut' });
    expect(res.statusCode).toBe(422);
  });
});

describe('🗑️ DELETE /:id — Suppression', () => {
  test('supprime une réservation existante', async () => {
    await Reservation.create({
      id: 20,
      hotel_id: 1,
      user_email: 'a@test.com',
      date_arrivee: '2026-08-10',
      date_depart: '2026-08-13',
      prix_total: 360,
    });

    const res = await request.delete('/20');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('supprimée');

    // Vérifier que la réservation n'existe plus en base
    const check = await Reservation.findOne({ id: 20 });
    expect(check).toBeNull();
  });

  test('retourne 404 pour un ID inexistant', async () => {
    const res = await request.delete('/99999');
    expect(res.statusCode).toBe(404);
  });
});
