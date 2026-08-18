'use strict';

const express = require('express');
const controller = require('../controllers/reservationController');

const router = express.Router();

// Health check
router.get('/health', controller.health);

// Réservations par utilisateur (email, userId, nom) — avant /:id !
router.get('/mes-reservations', controller.mesReservations);
router.get('/user/:userId', controller.byUser);

// CRUD
router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.store);
router.put('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
