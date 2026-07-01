// Fonctions à tester (copiées de la logique page hôtel)
const nbNuits = (dateArrivee: string, dateDepart: string): number => {
  if (!dateArrivee || !dateDepart) return 0;
  const diff = new Date(dateDepart).getTime() - new Date(dateArrivee).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const prixEstime = (prixParNuit: number, nuits: number, chambres: number): number => {
  return prixParNuit * nuits * chambres;
};

const getImageUrl = (image: string | null, baseUrl: string): string => {
  if (!image) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
  if (image.startsWith('http')) return image;
  return `${baseUrl}${image}`;
};

// ── Tests nbNuits ──────────────────────────────────────────────────────
describe('nbNuits()', () => {
  test('retourne 4 pour 4 jours', () => {
    expect(nbNuits('2025-08-01', '2025-08-05')).toBe(4);
  });

  test('retourne 0 si même date', () => {
    expect(nbNuits('2025-08-01', '2025-08-01')).toBe(0);
  });

  test('retourne 0 si dates vides', () => {
    expect(nbNuits('', '')).toBe(0);
  });

  test('retourne 0 si départ avant arrivée', () => {
    expect(nbNuits('2025-08-10', '2025-08-05')).toBe(0);
  });

  test('retourne 1 pour une nuit', () => {
    expect(nbNuits('2025-08-01', '2025-08-02')).toBe(1);
  });

  test('retourne 30 pour un mois', () => {
    expect(nbNuits('2025-08-01', '2025-08-31')).toBe(30);
  });
});

// ── Tests prixEstime ───────────────────────────────────────────────────
describe('prixEstime()', () => {
  test('200 DT x 4 nuits x 1 chambre = 800', () => {
    expect(prixEstime(200, 4, 1)).toBe(800);
  });

  test('100 DT x 7 nuits x 3 chambres = 2100', () => {
    expect(prixEstime(100, 7, 3)).toBe(2100);
  });

  test('retourne 0 si 0 nuits', () => {
    expect(prixEstime(200, 0, 1)).toBe(0);
  });

  test('350 DT x 1 nuit x 1 chambre = 350', () => {
    expect(prixEstime(350, 1, 1)).toBe(350);
  });
});

// ── Tests getImageUrl ──────────────────────────────────────────────────
describe('getImageUrl()', () => {
  test('retourne image par défaut si null', () => {
    const url = getImageUrl(null, 'http://127.0.0.1:8000');
    expect(url).toContain('unsplash.com');
  });

  test('retourne l\'URL telle quelle si http', () => {
    const url = getImageUrl('https://example.com/img.jpg', 'http://127.0.0.1:8000');
    expect(url).toBe('https://example.com/img.jpg');
  });

  test('préfixe baseUrl si chemin local', () => {
    const url = getImageUrl('/storage/hotels/img.jpg', 'http://127.0.0.1:8000');
    expect(url).toBe('http://127.0.0.1:8000/storage/hotels/img.jpg');
  });
});