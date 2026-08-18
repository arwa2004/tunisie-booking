'use strict';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  TESTS UNITAIRES & D'INTÉGRATION — hotel-service
 *  Framework : Jest + Supertest
 * ══════════════════════════════════════════════════════════════════════════════
 */

const supertest = require('supertest');
const app = require('../index.js');
const request = supertest(app);

describe('🏨 Tests Unitaires — Données du Catalogue Hôtelier', () => {

  test('le catalogue contient exactement 5 hôtels', async () => {
    const res = await request.get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(5);
  });

  test('chaque hôtel a les champs obligatoires (id, nom, etoiles, prix)', async () => {
    const res = await request.get('/');
    res.body.forEach(hotel => {
      expect(hotel).toHaveProperty('id');
      expect(hotel).toHaveProperty('nom');
      expect(hotel).toHaveProperty('etoiles');
      expect(hotel).toHaveProperty('prix_par_nuit');
      expect(hotel).toHaveProperty('image');
    });
  });

  test('les étoiles sont entre 1 et 5', async () => {
    const res = await request.get('/');
    res.body.forEach(hotel => {
      expect(hotel.etoiles).toBeGreaterThanOrEqual(1);
      expect(hotel.etoiles).toBeLessThanOrEqual(5);
    });
  });

  test('les prix sont positifs', async () => {
    const res = await request.get('/');
    res.body.forEach(hotel => {
      expect(hotel.prix_par_nuit).toBeGreaterThan(0);
    });
  });
});

describe('📍 Tests — Destinations', () => {

  test('GET /destinations retourne 5 destinations', async () => {
    const res = await request.get('/destinations');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(5);
  });

  test('chaque destination a un id, nom et region', async () => {
    const res = await request.get('/destinations');
    res.body.forEach(dest => {
      expect(dest).toHaveProperty('id');
      expect(dest).toHaveProperty('nom');
      expect(dest).toHaveProperty('region');
    });
  });

  test('GET /destinations/1 retourne Hammamet', async () => {
    const res = await request.get('/destinations/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.nom).toBe('Hammamet');
  });

  test('GET /destinations/999 retourne 404', async () => {
    const res = await request.get('/destinations/999');
    expect(res.statusCode).toBe(404);
  });
});

describe('🍷 Tests — Pensions', () => {

  test('GET /pensions retourne 4 types de pension', async () => {
    const res = await request.get('/pensions');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(4);
  });

  test('les pensions contiennent Petit Dejeuner et All Inclusive', async () => {
    const res = await request.get('/pensions');
    const noms = res.body.map(p => p.nom);
    expect(noms).toContain('Petit Dejeuner');
    expect(noms).toContain('All Inclusive');
  });
});

describe('🔍 Tests d\'Intégration — Détail d\'un Hôtel', () => {

  test('GET /1 retourne El Mouradi El Menzah avec chambres', async () => {
    const res = await request.get('/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.nom).toBe('El Mouradi El Menzah');
    expect(res.body.chambres).toBeDefined();
    expect(res.body.chambres.length).toBeGreaterThan(0);
  });

  test('GET /999 retourne 404 pour un hôtel inexistant', async () => {
    const res = await request.get('/999');
    expect(res.statusCode).toBe(404);
  });

  test('les chambres d\'un hôtel ont des pensions associées', async () => {
    const res = await request.get('/1');
    const chambre = res.body.chambres[0];
    expect(chambre.pensions).toBeDefined();
    expect(chambre.pensions.length).toBeGreaterThan(0);
  });
});

describe('🔎 Tests — Filtres de Recherche', () => {

  test('filtre par destination_id=1 retourne les hôtels de Hammamet', async () => {
    const res = await request.get('/?destination_id=1');
    expect(res.statusCode).toBe(200);
    res.body.forEach(hotel => {
      expect(hotel.destination_id).toBe(1);
    });
  });

  test('filtre par etoiles=5 retourne uniquement les 5 étoiles', async () => {
    const res = await request.get('/?etoiles=5');
    expect(res.statusCode).toBe(200);
    res.body.forEach(hotel => {
      expect(hotel.etoiles).toBe(5);
    });
  });

  test('filtre par prix_max=200 retourne les hôtels abordables', async () => {
    const res = await request.get('/?prix_max=200');
    expect(res.statusCode).toBe(200);
    res.body.forEach(hotel => {
      expect(hotel.prix_par_nuit).toBeLessThanOrEqual(200);
    });
  });
});

describe('🏥 Health Check', () => {

  test('GET /health retourne status UP', async () => {
    const res = await request.get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.service).toBe('hotel-service');
  });
});
