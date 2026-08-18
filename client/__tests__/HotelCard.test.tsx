/**
 * Tests unitaires — Carte Hôtel (HotelCard)
 *
 * Ces tests vérifient que la carte d'hôtel affiche correctement :
 * - Le nom de l'hôtel
 * - Le prix par nuit
 * - Le nombre d'étoiles
 * - Le badge de disponibilité
 * - Le lien vers la page de détail
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// ── Composant à tester ────────────────────────────────────────────────────

interface HotelCardProps {
  id: number;
  nom: string;
  prixParNuit: number;
  etoiles: number;
  disponible: boolean;
  destination?: string;
}

function HotelCard({ id, nom, prixParNuit, etoiles, disponible, destination }: HotelCardProps) {
  return (
    <div data-testid={`hotel-card-${id}`}>
      <h2>{nom}</h2>
      <p data-testid="prix">{prixParNuit} DT / nuit</p>
      <p data-testid="etoiles">{'⭐'.repeat(etoiles)}</p>
      {destination && <p data-testid="destination">{destination}</p>}
      <span data-testid="disponibilite">
        {disponible ? 'Disponible' : 'Indisponible'}
      </span>
      <a href={`/hotels/${id}`}>Voir l'hôtel</a>
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('HotelCard — Tests unitaires de la carte hôtel', () => {

  // Données fictives réutilisées dans les tests
  const hotelDisponible = {
    id: 1,
    nom: 'Hôtel Les Oliviers',
    prixParNuit: 250,
    etoiles: 4,
    disponible: true,
    destination: 'Sousse',
  };

  // ── Affichage des informations ────────────────────────────────────────────

  test('affiche le nom de l\'hôtel', () => {
    render(<HotelCard {...hotelDisponible} />);
    // getByText : trouve un élément contenant ce texte exact
    expect(screen.getByText('Hôtel Les Oliviers')).toBeInTheDocument();
  });

  test('affiche le prix par nuit', () => {
    render(<HotelCard {...hotelDisponible} />);
    expect(screen.getByTestId('prix')).toHaveTextContent('250 DT / nuit');
  });

  test('affiche le bon nombre d\'étoiles', () => {
    render(<HotelCard {...hotelDisponible} />);
    // 4 étoiles = 4 fois le symbole ⭐
    expect(screen.getByTestId('etoiles')).toHaveTextContent('⭐⭐⭐⭐');
  });

  test('affiche la destination quand elle est fournie', () => {
    render(<HotelCard {...hotelDisponible} />);
    expect(screen.getByTestId('destination')).toHaveTextContent('Sousse');
  });

  test("n'affiche pas la destination quand elle est absente", () => {
    const { id, nom, prixParNuit, etoiles, disponible } = hotelDisponible;
    render(<HotelCard id={id} nom={nom} prixParNuit={prixParNuit} etoiles={etoiles} disponible={disponible} />);
    expect(screen.queryByTestId('destination')).not.toBeInTheDocument();
  });

  // ── Badge de disponibilité ────────────────────────────────────────────────

  test('affiche "Disponible" quand l\'hôtel est disponible', () => {
    render(<HotelCard {...hotelDisponible} />);
    expect(screen.getByTestId('disponibilite')).toHaveTextContent('Disponible');
  });

  test('affiche "Indisponible" quand l\'hôtel est indisponible', () => {
    render(<HotelCard {...hotelDisponible} disponible={false} />);
    expect(screen.getByTestId('disponibilite')).toHaveTextContent('Indisponible');
  });

  // ── Lien vers le détail ───────────────────────────────────────────────────

  test('affiche un lien vers la page de détail de l\'hôtel', () => {
    render(<HotelCard {...hotelDisponible} />);
    const lien = screen.getByRole('link', { name: /voir l'hôtel/i });
    // toHaveAttribute : vérifie la valeur d'un attribut HTML (href, type, disabled...)
    expect(lien).toHaveAttribute('href', '/hotels/1');
  });

  // ── Tests de rendu avec des valeurs limites ───────────────────────────────

  test('affiche 1 étoile pour un hôtel 1 étoile', () => {
    render(<HotelCard {...hotelDisponible} etoiles={1} />);
    expect(screen.getByTestId('etoiles')).toHaveTextContent('⭐');
  });

  test('affiche 5 étoiles pour un hôtel 5 étoiles', () => {
    render(<HotelCard {...hotelDisponible} etoiles={5} />);
    expect(screen.getByTestId('etoiles')).toHaveTextContent('⭐⭐⭐⭐⭐');
  });
});
