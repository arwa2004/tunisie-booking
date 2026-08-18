'use strict';
const express = require('express');
const app     = express();
app.use(express.json());
// Note: CORS est géré par Nginx (api-gateway) — pas de middleware CORS ici

// ══════════════════════════════════════════════════════════════════════════════
// DONNÉES — REPRODUCTION FIDÈLE DU SEEDER LARAVEL
// ══════════════════════════════════════════════════════════════════════════════

const PENSIONS = [
  { id: 1, nom: 'Petit Dejeuner',     supplement_prix: 0   },
  { id: 2, nom: 'Demi Pension',       supplement_prix: 40  },
  { id: 3, nom: 'All Inclusive Soft', supplement_prix: 70  },
  { id: 4, nom: 'All Inclusive',      supplement_prix: 100 },
];

const SERVICES = {
  wifi:       { id: 1, nom: 'WiFi Gratuit',    icone: 'wifi'       },
  piscine:    { id: 2, nom: 'Piscine',          icone: 'pool'       },
  spa:        { id: 3, nom: 'Spa & Bien-etre',  icone: 'spa'        },
  restaurant: { id: 4, nom: 'Restaurant',       icone: 'restaurant' },
  parking:    { id: 5, nom: 'Parking',          icone: 'parking'    },
  plage:      { id: 6, nom: 'Plage Privee',     icone: 'beach'      },
  clim:       { id: 7, nom: 'Climatisation',    icone: 'ac'         },
  sport:      { id: 8, nom: 'Salle de Sport',   icone: 'fitness'    },
};

const DESTINATIONS = [
  { id: 1, nom: 'Hammamet', region: 'Nabeul',   image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=60' },
  { id: 2, nom: 'Djerba',   region: 'Medenine', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop&q=60' },
  { id: 3, nom: 'Sousse',   region: 'Sousse',   image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop&q=60' },
  { id: 4, nom: 'Tabarka',  region: 'Jendouba', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&auto=format' },
  { id: 5, nom: 'Tozeur',   region: 'Tozeur',   image: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=600&auto=format' },
];

// ── Génère les 10 types de chambres comme le HotelSeeder Laravel ─────────────
function genererChambres(hotelId, prixBase, startId) {
  const types = [
    { type: 'simple',    nom: 'Chambre Single Standard',    mult: 0.80, adultes: 1, enfants: 0, qte: 8  },
    { type: 'simple',    nom: 'Chambre Single Vue Piscine', mult: 0.95, adultes: 1, enfants: 0, qte: 5  },
    { type: 'simple',    nom: 'Chambre Single Vue Mer',     mult: 1.10, adultes: 1, enfants: 0, qte: 3  },
    { type: 'double',    nom: 'Chambre Double Standard',    mult: 1.00, adultes: 2, enfants: 1, qte: 12 },
    { type: 'double',    nom: 'Chambre Double Vue Piscine', mult: 1.15, adultes: 2, enfants: 1, qte: 8  },
    { type: 'double',    nom: 'Chambre Double Vue Mer',     mult: 1.30, adultes: 2, enfants: 1, qte: 6  },
    { type: 'triple',    nom: 'Chambre Triple Vue Jardin',  mult: 1.30, adultes: 3, enfants: 1, qte: 6  },
    { type: 'triple',    nom: 'Chambre Triple Vue Mer',     mult: 1.55, adultes: 3, enfants: 1, qte: 4  },
    { type: 'familiale', nom: 'Suite Familiale Standard',   mult: 1.70, adultes: 4, enfants: 2, qte: 4  },
    { type: 'familiale', nom: 'Suite Familiale Vue Mer',    mult: 2.00, adultes: 4, enfants: 2, qte: 3  },
  ];
  return types.map((t, i) => ({
    id:               startId + i,
    hotel_id:         hotelId,
    type:             t.type,
    nom:              t.nom,
    prix_base_nuit:   Math.round(prixBase * t.mult),
    capacite_adultes: t.adultes,
    capacite_enfants: t.enfants,
    quantite:         t.qte,
    pensions: PENSIONS.map(p => ({
      id: p.id, nom: p.nom,
      pivot: { supplement_prix: p.supplement_prix }
    })),
  }));
}

function servicesParEtoiles(etoiles) {
  const all = Object.values(SERVICES);
  if (etoiles >= 5) return all;
  if (etoiles >= 4) return [SERVICES.wifi, SERVICES.piscine, SERVICES.restaurant, SERVICES.parking, SERVICES.clim];
  return [SERVICES.wifi, SERVICES.restaurant, SERVICES.parking, SERVICES.clim];
}

function photosParDefaut(hotelId, startId) {
  return [
    { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', alt_text: 'Vue exterieure' },
    { url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', alt_text: "Hall d'accueil"  },
    { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', alt_text: 'Piscine'         },
    { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', alt_text: 'Chambre'         },
  ].map((p, i) => ({ id: startId + i, hotel_id: hotelId, url: p.url, alt_text: p.alt_text, ordre: i }));
}

// ── 5 hôtels du HotelSeeder Laravel ──────────────────────────────────────────
const HOTELS_BASE = [
  { id: 1, destination_id: 1, nom: 'El Mouradi El Menzah',                     prix_par_nuit: 120, etoiles: 4, disponible: true,
    description: "Situe au coeur de la station balneaire de Yasmine Hammamet, cet hotel propose un hebergement confortable a proximite directe de la plage.",
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=60' },
  { id: 2, destination_id: 1, nom: 'The Orangers Garden Villa & Bungalows',     prix_par_nuit: 350, etoiles: 5, disponible: true,
    description: "Un luxueux hotel entoure de jardins d'orangers avec un acces direct a une plage privee de sable fin.",
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500&auto=format&fit=crop&q=60' },
  { id: 3, destination_id: 2, nom: 'Hasdrubal Prestige Thalassa & Spa Djerba',  prix_par_nuit: 450, etoiles: 5, disponible: true,
    description: "Un havre de paix et de luxe sur la magnifique plage de Sidi Mehrez, repute pour son centre de thalassotherapie haut de gamme.",
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop&q=60' },
  { id: 4, destination_id: 2, nom: 'Djerba Plaza Thalasso & Spa',               prix_par_nuit: 180, etoiles: 4, disponible: true,
    description: "Alliant architecture traditionnelle djerbienne et confort moderne, au milieu d'une superbe palmeraie.",
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&auto=format&fit=crop&q=60' },
  { id: 5, destination_id: 3, nom: 'Movenpick Resort & Marine Spa Sousse',      prix_par_nuit: 280, etoiles: 5, disponible: true,
    description: "Idealement situe au centre de Sousse, avec une plage de sable fin privee, des piscines d'eau de mer et des restaurants gastronomiques.",
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop&q=60' },
];

// Enrichissement complet (chambres × 10 + services + photos)
const HOTELS = HOTELS_BASE.map((h, hi) => ({
  ...h,
  destination: DESTINATIONS.find(d => d.id === h.destination_id),
  chambres:    genererChambres(h.id, h.prix_par_nuit, hi * 10 + 1),
  services:    servicesParEtoiles(h.etoiles),
  photos:      photosParDefaut(h.id, hi * 4 + 1),
}));

let nextHotelId   = 6;
let nextChambreId = 51;
let nextAvisId    = 10;

// ── Avis réalistes ────────────────────────────────────────────────────────────
const AVIS = [
  { id:1, hotel_id:1, user_id:1, user:{id:1,nom:'Ben Amar',prenom:'Arwa'},
    note_globale:8, note_qualite_prix:9, note_chambres:8, note_emplacement:9,
    note_proprete:8, note_services:7, note_equipements:8,
    commentaire:"Sejour inoubliable ! Le personnel est aux petits soins et la plage est magnifique.",
    created_at:"2026-07-15T10:00:00Z" },
  { id:2, hotel_id:1, user_id:2, user:{id:2,nom:'Trabelsi',prenom:'Mohamed'},
    note_globale:7, note_qualite_prix:7, note_chambres:7, note_emplacement:8,
    note_proprete:8, note_services:6, note_equipements:7,
    commentaire:"Tres bon rapport qualite-prix. Buffet varie et chambres propres.",
    created_at:"2026-07-20T14:30:00Z" },
  { id:3, hotel_id:2, user_id:3, user:{id:3,nom:'Chaabane',prenom:'Ines'},
    note_globale:10, note_qualite_prix:9, note_chambres:10, note_emplacement:10,
    note_proprete:10, note_services:10, note_equipements:9,
    commentaire:"Hotel de reve ! Le jardin d'orangers est un paradis. Le spa est exceptionnel.",
    created_at:"2026-07-10T09:00:00Z" },
  { id:4, hotel_id:3, user_id:1, user:{id:1,nom:'Ben Amar',prenom:'Arwa'},
    note_globale:9, note_qualite_prix:8, note_chambres:9, note_emplacement:10,
    note_proprete:10, note_services:9, note_equipements:9,
    commentaire:"La thalasso est extraordinaire. Vue sur mer depuis la chambre = bonheur total.",
    created_at:"2026-06-28T11:15:00Z" },
  { id:5, hotel_id:3, user_id:4, user:{id:4,nom:'Hamdi',prenom:'Sami'},
    note_globale:8, note_qualite_prix:7, note_chambres:9, note_emplacement:9,
    note_proprete:9, note_services:8, note_equipements:8,
    commentaire:"Superbe etablissement, legerement cher mais on en a pour son argent.",
    created_at:"2026-07-02T16:45:00Z" },
  { id:6, hotel_id:4, user_id:2, user:{id:2,nom:'Trabelsi',prenom:'Mohamed'},
    note_globale:7, note_qualite_prix:8, note_chambres:7, note_emplacement:8,
    note_proprete:7, note_services:7, note_equipements:6,
    commentaire:"Cadre magnifique dans la palmeraie. Architecture djerbienne authentique.",
    created_at:"2026-07-18T08:20:00Z" },
  { id:7, hotel_id:5, user_id:3, user:{id:3,nom:'Chaabane',prenom:'Ines'},
    note_globale:9, note_qualite_prix:8, note_chambres:9, note_emplacement:9,
    note_proprete:9, note_services:9, note_equipements:9,
    commentaire:"Excellent hotel en plein centre de Sousse. Le spa marin est remarquable.",
    created_at:"2026-07-25T13:00:00Z" },
  { id:8, hotel_id:5, user_id:4, user:{id:4,nom:'Hamdi',prenom:'Sami'},
    note_globale:10, note_qualite_prix:9, note_chambres:10, note_emplacement:9,
    note_proprete:10, note_services:10, note_equipements:10,
    commentaire:"Le meilleur hotel de Sousse sans conteste. Service irreprochaable !",
    created_at:"2026-08-01T17:30:00Z" },
];

function calcMoyennes(avis) {
  const count = avis.length;
  if (!count) return { count:0, moyennes:null, pct_recommande:0, avis:[] };
  const avg = f => {
    const vals = avis.filter(a => a[f] != null).map(a => a[f]);
    return vals.length ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length*10)/10 : null;
  };
  return {
    count,
    moyennes: {
      globale:      avg('note_globale'),
      qualite_prix: avg('note_qualite_prix'),
      chambres:     avg('note_chambres'),
      emplacement:  avg('note_emplacement'),
      proprete:     avg('note_proprete'),
      services:     avg('note_services'),
      equipements:  avg('note_equipements'),
    },
    pct_recommande: Math.round(avis.filter(a=>a.note_globale>=7).length/count*100),
    avis,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES (sans préfixe /hotels — Nginx strip déjà /api/hotels)
// ══════════════════════════════════════════════════════════════════════════════

// GET /  → liste hôtels (Nginx envoie / quand le client demande /api/hotels)
app.get('/', (req, res) => {
  let result = [...HOTELS];
  if (req.query.destination_id) result = result.filter(h => h.destination_id === +req.query.destination_id);
  if (req.query.etoiles)        result = result.filter(h => h.etoiles         === +req.query.etoiles);
  if (req.query.prix_max)       result = result.filter(h => h.prix_par_nuit   <= +req.query.prix_max);
  if (req.query.disponible !== undefined) {
    const dispo = req.query.disponible === 'true' || req.query.disponible === '1';
    result = result.filter(h => h.disponible === dispo);
  }

  // Si filtrage par destination_id → inclure les chambres (besoin de DestinationHotelsSection)
  // Sinon → liste légère sans chambres (comme Laravel HotelController::index)
  if (req.query.destination_id) {
    res.json(result); // données complètes avec chambres + pensions
  } else {
    res.json(result.map(({ chambres, ...h }) => h)); // sans chambres
  }
});

// ── ALIAS /voyages → retourne la liste des hôtels (compatibilité frontend admin) ──
app.get('/voyages', (_req, res) => {
  res.json(HOTELS.map(({ chambres, ...h }) => h));
});


// GET /health → health check service
app.get('/health', (_req, res) => {
  res.json({ service: 'hotel-service', framework: 'Node.js / Express', status: 'UP', hotels_count: HOTELS.length });
});

// GET /destinations → liste des 5 destinations
app.get('/destinations', (_req, res) => res.json(DESTINATIONS));

// GET /destinations/:id
app.get('/destinations/:id', (req, res) => {
  const dest = DESTINATIONS.find(d => d.id === +req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination non trouvee.' });
  res.json(dest);
});

// POST /destinations → créer une destination
let nextDestId = 6;
app.post('/destinations', (req, res) => {
  const { nom, region, image } = req.body;
  if (!nom || !region)
    return res.status(422).json({ message: 'Champs obligatoires : nom, region.' });
  const dest = { id: nextDestId++, nom, region, image: image || null };
  DESTINATIONS.push(dest);
  res.status(201).json(dest);
});

// PUT /destinations/:id → modifier une destination
app.put('/destinations/:id', (req, res) => {
  const idx = DESTINATIONS.findIndex(d => d.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Destination non trouvee.' });
  const { nom, region, image } = req.body;
  if (nom)  DESTINATIONS[idx].nom  = nom;
  if (region) DESTINATIONS[idx].region = region;
  if (image)  DESTINATIONS[idx].image = image;
  res.json(DESTINATIONS[idx]);
});

// DELETE /destinations/:id → supprimer une destination
app.delete('/destinations/:id', (req, res) => {
  const idx = DESTINATIONS.findIndex(d => d.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Destination non trouvee.' });
  DESTINATIONS.splice(idx, 1);
  res.json({ message: 'Destination supprimee avec succes.' });
});

// GET /pensions
app.get('/pensions', (_req, res) => res.json(PENSIONS));

// GET /services
app.get('/services', (_req, res) => res.json(Object.values(SERVICES)));

// ── IMPORTANT : /:id/avis AVANT /:id ─────────────────────────────────────────

// GET /:id/avis → avis + stats
app.get('/:id/avis', (req, res) => {
  const hotelId = +req.params.id;
  const hotel   = HOTELS.find(h => h.id === hotelId);
  if (!hotel) return res.status(404).json({ message: 'Hotel non trouve.' });
  const avis = AVIS.filter(a => a.hotel_id === hotelId)
                   .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(calcMoyennes(avis));
});

// POST /:id/avis → créer un avis
app.post('/:id/avis', (req, res) => {
  const hotelId = +req.params.id;
  const hotel   = HOTELS.find(h => h.id === hotelId);
  if (!hotel) return res.status(404).json({ message: 'Hotel non trouve.' });
  const { note_globale, note_qualite_prix, note_chambres, note_emplacement,
          note_proprete, note_services, note_equipements, commentaire, user_id, user_nom } = req.body;
  if (!note_globale || note_globale < 1 || note_globale > 10)
    return res.status(422).json({ message: 'note_globale entre 1 et 10 obligatoire.' });
  const avis = {
    id: nextAvisId++, hotel_id: hotelId,
    user_id: user_id || 0,
    user: { id: user_id || 0, nom: user_nom || 'Anonyme', prenom: '' },
    note_globale, note_qualite_prix: note_qualite_prix||null,
    note_chambres: note_chambres||null, note_emplacement: note_emplacement||null,
    note_proprete: note_proprete||null, note_services: note_services||null,
    note_equipements: note_equipements||null,
    commentaire: commentaire||null,
    created_at: new Date().toISOString(),
  };
  AVIS.push(avis);
  res.status(201).json(avis);
});

// GET /:id/chambres → liste des chambres d'un hôtel (via /api/hotels/:id/chambres)
app.get('/:id/chambres', (req, res) => {
  const hotel = HOTELS.find(h => h.id === +req.params.id);
  if (!hotel) return res.status(404).json({ message: 'Hotel non trouve.' });
  res.json(hotel.chambres || []);
});

// POST /chambres/:id → mettre à jour une chambre
app.post('/chambres/:id', (req, res) => {
  const chambreId = +req.params.id;
  for (const hotel of HOTELS) {
    const idx = (hotel.chambres || []).findIndex(c => c.id === chambreId);
    if (idx !== -1) {
      const { nom, prix_base_nuit, quantite } = req.body;
      if (nom)            hotel.chambres[idx].nom = nom;
      if (prix_base_nuit != null) hotel.chambres[idx].prix_base_nuit = +prix_base_nuit;
      if (quantite != null)      hotel.chambres[idx].quantite = +quantite;
      return res.json(hotel.chambres[idx]);
    }
  }
  return res.status(404).json({ message: 'Chambre non trouvee.' });
});

// POST /chambres/:id/pensions → synchroniser les suppléments de pension d'une chambre
app.post('/chambres/:id/pensions', (req, res) => {
  const chambreId = +req.params.id;
  const { pensions } = req.body;
  if (!Array.isArray(pensions))
    return res.status(422).json({ message: 'Le champ pensions doit etre un tableau.' });

  for (const hotel of HOTELS) {
    const chambre = (hotel.chambres || []).find(c => c.id === chambreId);
    if (chambre) {
      const existing = chambre.pensions || [];
      pensions.forEach(p => {
        const found = existing.find(e => e.id === +p.id);
        if (found) found.pivot = { supplement_prix: +p.supplement_prix || 0 };
        else {
          const pensionInfo = PENSIONS.find(P => P.id === +p.id);
          existing.push({ id: +p.id, nom: pensionInfo ? pensionInfo.nom : `Pension ${p.id}`, pivot: { supplement_prix: +p.supplement_prix || 0 } });
        }
      });
      chambre.pensions = existing;
      return res.json(chambre);
    }
  }
  return res.status(404).json({ message: 'Chambre non trouvee.' });
});

// GET /:id → détail complet (chambres + pensions + services + photos)
app.get('/:id', (req, res) => {
  const hotel = HOTELS.find(h => h.id === +req.params.id);
  if (!hotel) return res.status(404).json({ message: 'Hotel non trouve.' });
  res.json(hotel);
});

// POST / → créer un hôtel
app.post('/', (req, res) => {
  const { destination_id, nom, prix_par_nuit, etoiles, description, image, disponible } = req.body;
  if (!destination_id || !nom || !prix_par_nuit || !etoiles)
    return res.status(422).json({ message: 'Champs obligatoires : destination_id, nom, prix_par_nuit, etoiles.' });
  const dest = DESTINATIONS.find(d => d.id === +destination_id);
  if (!dest) return res.status(422).json({ message: 'Destination invalide.' });
  const id = nextHotelId++;
  const hotel = {
    id, destination_id: +destination_id, nom,
    prix_par_nuit: +prix_par_nuit, etoiles: +etoiles,
    description: description||null, image: image||null,
    disponible: disponible !== undefined ? !!disponible : true,
    destination: dest,
    chambres:    genererChambres(id, +prix_par_nuit, nextChambreId),
    services:    servicesParEtoiles(+etoiles),
    photos:      photosParDefaut(id, 1),
  };
  nextChambreId += 10;
  HOTELS.push(hotel);
  res.status(201).json(hotel);
});

// PUT /:id → modifier un hôtel
app.put('/:id', (req, res) => {
  const idx = HOTELS.findIndex(h => h.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Hotel non trouve.' });
  const h = HOTELS[idx];
  const updated = { ...h, ...req.body, id: h.id };
  if (req.body.destination_id) {
    const dest = DESTINATIONS.find(d => d.id === +req.body.destination_id);
    if (!dest) return res.status(422).json({ message: 'Destination invalide.' });
    updated.destination = dest;
  }
  HOTELS[idx] = updated;
  res.json(updated);
});

// DELETE /:id → supprimer un hôtel
app.delete('/:id', (req, res) => {
  const idx = HOTELS.findIndex(h => h.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Hotel non trouve.' });
  HOTELS.splice(idx, 1);
  res.json({ message: 'Hotel supprime avec succes.' });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ service: 'hotel-service', framework: 'Node.js / Express', status: 'UP 🟢', hotels: HOTELS.length });
});

// ══════════════════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 8000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Hotel Service (Node.js) running on port ${PORT}`));
}

module.exports = app;
