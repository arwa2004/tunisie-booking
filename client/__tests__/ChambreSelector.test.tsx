/**
 * Tests unitaires — Sélecteur de chambres (ChambreSelector)
 *
 * Ces tests vérifient la logique du sélecteur de chambres :
 * - Affichage de la liste des chambres disponibles
 * - Filtrage par nombre d'adultes (correspondance exacte)
 * - Sélection d'une chambre
 * - Calcul du prix selon la pension choisie
 * - Message si aucune chambre ne correspond
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Pension {
  id: number;
  nom: string;
  pivot: { supplement_prix: number };
}

interface Chambre {
  id: number;
  nom: string;
  type: string;
  prix_base_nuit: number;
  capacite_adultes: number;
  capacite_enfants: number;
  quantite: number;
  pensions: Pension[];
}

interface ChambreSelectorProps {
  chambres: Chambre[];
  nbAdultes: number;
  nbEnfants: number;
  nbNuits: number;
  onSelect: (chambreId: number, pensionId: number, prixTotal: number) => void;
}

// ── Composant simplifié pour les tests ───────────────────────────────────────

function ChambreSelector({ chambres, nbAdultes, nbEnfants, nbNuits, onSelect }: ChambreSelectorProps) {
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [pensionIds, setPensionIds] = React.useState<Record<number, number>>({});

  const filtered = chambres.filter(
    c => c.capacite_adultes === nbAdultes && c.capacite_enfants >= nbEnfants
  );

  const getPrix = (ch: Chambre) => {
    const pensionId = pensionIds[ch.id] ?? ch.pensions[0]?.id;
    const pension = ch.pensions.find(p => p.id === pensionId);
    return (ch.prix_base_nuit + (pension?.pivot.supplement_prix ?? 0)) * nbNuits;
  };

  if (filtered.length === 0) {
    return <p data-testid="no-rooms">Aucune chambre disponible pour ces critères.</p>;
  }

  return (
    <div>
      {filtered.map(ch => (
        <div key={ch.id} data-testid={`chambre-${ch.id}`}>
          <span data-testid={`nom-${ch.id}`}>{ch.nom}</span>
          <span data-testid={`prix-${ch.id}`}>{getPrix(ch)} DT</span>
          <select
            data-testid={`pension-select-${ch.id}`}
            onChange={e => setPensionIds(prev => ({ ...prev, [ch.id]: Number(e.target.value) }))}
          >
            {ch.pensions.map(p => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
          <button
            data-testid={`select-btn-${ch.id}`}
            onClick={() => {
              setSelectedId(ch.id);
              const pensionId = pensionIds[ch.id] ?? ch.pensions[0]?.id;
              onSelect(ch.id, pensionId, getPrix(ch));
            }}
          >
            Sélectionner
          </button>
          {selectedId === ch.id && <span data-testid="selected-badge">✓ Sélectionnée</span>}
        </div>
      ))}
    </div>
  );
}

// ── Données de test ──────────────────────────────────────────────────────────

const pensionPD  = { id: 1, nom: 'Petit Déjeuner',  pivot: { supplement_prix: 0  } };
const pensionDP  = { id: 2, nom: 'Demi Pension',     pivot: { supplement_prix: 40 } };
const pensionAI  = { id: 3, nom: 'All Inclusive',    pivot: { supplement_prix: 100} };

const chambres: Chambre[] = [
  {
    id: 1,
    nom: 'Chambre Single Standard',
    type: 'simple',
    prix_base_nuit: 100,
    capacite_adultes: 1,
    capacite_enfants: 0,
    quantite: 5,
    pensions: [pensionPD, pensionDP, pensionAI],
  },
  {
    id: 2,
    nom: 'Chambre Double Standard',
    type: 'double',
    prix_base_nuit: 150,
    capacite_adultes: 2,
    capacite_enfants: 1,
    quantite: 8,
    pensions: [pensionPD, pensionDP, pensionAI],
  },
  {
    id: 3,
    nom: 'Suite Familiale',
    type: 'familiale',
    prix_base_nuit: 280,
    capacite_adultes: 4,
    capacite_enfants: 2,
    quantite: 3,
    pensions: [pensionPD, pensionDP, pensionAI],
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChambreSelector — Tests unitaires du sélecteur de chambres', () => {

  it('affiche seulement les chambres correspondant au nombre exact d\'adultes', () => {
    render(
      <ChambreSelector chambres={chambres} nbAdultes={2} nbEnfants={0} nbNuits={3} onSelect={jest.fn()} />
    );
    // Seule la chambre Double (2 adultes) doit s'afficher
    expect(screen.getByTestId('chambre-2')).toBeInTheDocument();
    expect(screen.queryByTestId('chambre-1')).not.toBeInTheDocument(); // Single = 1 adulte
    expect(screen.queryByTestId('chambre-3')).not.toBeInTheDocument(); // Familiale = 4 adultes
  });

  it('affiche un message si aucune chambre ne correspond', () => {
    render(
      <ChambreSelector chambres={chambres} nbAdultes={5} nbEnfants={0} nbNuits={3} onSelect={jest.fn()} />
    );
    expect(screen.getByTestId('no-rooms')).toBeInTheDocument();
    expect(screen.getByTestId('no-rooms')).toHaveTextContent('Aucune chambre disponible');
  });

  it('calcule le prix total correctement pour 3 nuits sans supplément pension', () => {
    render(
      <ChambreSelector chambres={chambres} nbAdultes={2} nbEnfants={0} nbNuits={3} onSelect={jest.fn()} />
    );
    // 150 DT/nuit × 3 nuits = 450 DT
    expect(screen.getByTestId('prix-2')).toHaveTextContent('450 DT');
  });

  it('recalcule le prix quand on change la pension', () => {
    render(
      <ChambreSelector chambres={chambres} nbAdultes={2} nbEnfants={0} nbNuits={3} onSelect={jest.fn()} />
    );
    // Changer vers Demi Pension (+40 DT/nuit) → (150+40) × 3 = 570
    fireEvent.change(screen.getByTestId('pension-select-2'), { target: { value: '2' } });
    expect(screen.getByTestId('prix-2')).toHaveTextContent('570 DT');
  });

  it('recalcule le prix vers All Inclusive (+100 DT/nuit)', () => {
    render(
      <ChambreSelector chambres={chambres} nbAdultes={2} nbEnfants={0} nbNuits={3} onSelect={jest.fn()} />
    );
    // (150 + 100) × 3 = 750
    fireEvent.change(screen.getByTestId('pension-select-2'), { target: { value: '3' } });
    expect(screen.getByTestId('prix-2')).toHaveTextContent('750 DT');
  });

  it('affiche le badge "Sélectionnée" après avoir cliqué sur Sélectionner', () => {
    render(
      <ChambreSelector chambres={chambres} nbAdultes={2} nbEnfants={0} nbNuits={3} onSelect={jest.fn()} />
    );
    fireEvent.click(screen.getByTestId('select-btn-2'));
    expect(screen.getByTestId('selected-badge')).toBeInTheDocument();
  });

  it('appelle onSelect avec les bons paramètres', () => {
    const onSelect = jest.fn();
    render(
      <ChambreSelector chambres={chambres} nbAdultes={2} nbEnfants={0} nbNuits={3} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByTestId('select-btn-2'));
    // pension par défaut = PD (id=1, supplement=0) → 150 × 3 = 450
    expect(onSelect).toHaveBeenCalledWith(2, 1, 450);
  });

  it('appelle onSelect avec le bon prix après changement de pension', () => {
    const onSelect = jest.fn();
    render(
      <ChambreSelector chambres={chambres} nbAdultes={2} nbEnfants={0} nbNuits={3} onSelect={onSelect} />
    );
    // Changer vers Demi Pension
    fireEvent.change(screen.getByTestId('pension-select-2'), { target: { value: '2' } });
    fireEvent.click(screen.getByTestId('select-btn-2'));
    // (150 + 40) × 3 = 570
    expect(onSelect).toHaveBeenCalledWith(2, 2, 570);
  });

  it('filtre correctement les chambres pour 1 adulte', () => {
    render(
      <ChambreSelector chambres={chambres} nbAdultes={1} nbEnfants={0} nbNuits={2} onSelect={jest.fn()} />
    );
    expect(screen.getByTestId('chambre-1')).toBeInTheDocument();
    expect(screen.queryByTestId('chambre-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chambre-3')).not.toBeInTheDocument();
  });

  it('calcule le prix pour 1 adulte sur 2 nuits', () => {
    render(
      <ChambreSelector chambres={chambres} nbAdultes={1} nbEnfants={0} nbNuits={2} onSelect={jest.fn()} />
    );
    // 100 × 2 = 200
    expect(screen.getByTestId('prix-1')).toHaveTextContent('200 DT');
  });
});
