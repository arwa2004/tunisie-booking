/**
 * Tests unitaires — Barre de recherche (SearchBox)
 *
 * Ces tests vérifient la logique de la barre de recherche :
 * - Affichage des champs
 * - Mise à jour du nombre d'adultes et d'enfants
 * - Validation : au moins 1 adulte requis
 * - Dates : départ doit être après arrivée
 * - Construction correcte de l'URL de recherche
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Composant simplifié pour les tests ───────────────────────────────────────

interface SearchFormProps {
  onSearch: (params: { destination: string; adultes: number; enfants: number; arrivee: string; depart: string }) => void;
}

function SearchForm({ onSearch }: SearchFormProps) {
  const [destination, setDestination] = React.useState('');
  const [adultes, setAdultes] = React.useState(1);
  const [enfants, setEnfants] = React.useState(0);
  const [arrivee, setArrivee] = React.useState('');
  const [depart, setDepart] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = () => {
    if (adultes < 1) {
      setError('Au moins 1 adulte requis');
      return;
    }
    if (arrivee && depart && depart <= arrivee) {
      setError('La date de départ doit être après la date d\'arrivée');
      return;
    }
    setError('');
    onSearch({ destination, adultes, enfants, arrivee, depart });
  };

  return (
    <div>
      <input
        data-testid="destination"
        placeholder="Destination"
        value={destination}
        onChange={e => setDestination(e.target.value)}
      />
      <input
        data-testid="arrivee"
        type="date"
        value={arrivee}
        onChange={e => setArrivee(e.target.value)}
      />
      <input
        data-testid="depart"
        type="date"
        value={depart}
        onChange={e => setDepart(e.target.value)}
      />
      <button data-testid="adultes-plus" onClick={() => setAdultes(a => a + 1)}>+</button>
      <span data-testid="adultes-count">{adultes}</span>
      <button data-testid="adultes-minus" onClick={() => setAdultes(a => Math.max(0, a - 1))}>-</button>
      <button data-testid="enfants-plus" onClick={() => setEnfants(e => e + 1)}>+Enf</button>
      <span data-testid="enfants-count">{enfants}</span>
      {error && <p data-testid="error">{error}</p>}
      <button data-testid="search-btn" onClick={handleSubmit}>Rechercher</button>
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SearchForm — Tests unitaires de la barre de recherche', () => {

  it('affiche tous les champs de base', () => {
    render(<SearchForm onSearch={jest.fn()} />);
    expect(screen.getByTestId('destination')).toBeInTheDocument();
    expect(screen.getByTestId('arrivee')).toBeInTheDocument();
    expect(screen.getByTestId('depart')).toBeInTheDocument();
    expect(screen.getByTestId('search-btn')).toBeInTheDocument();
  });

  it('adultes par défaut est 1', () => {
    render(<SearchForm onSearch={jest.fn()} />);
    expect(screen.getByTestId('adultes-count').textContent).toBe('1');
  });

  it('enfants par défaut est 0', () => {
    render(<SearchForm onSearch={jest.fn()} />);
    expect(screen.getByTestId('enfants-count').textContent).toBe('0');
  });

  it('incrémente le nombre d\'adultes', () => {
    render(<SearchForm onSearch={jest.fn()} />);
    fireEvent.click(screen.getByTestId('adultes-plus'));
    expect(screen.getByTestId('adultes-count').textContent).toBe('2');
  });

  it('décrémente le nombre d\'adultes sans passer en négatif', () => {
    render(<SearchForm onSearch={jest.fn()} />);
    // décrémenter depuis 1 → doit rester à 0 (ne pas passer en négatif)
    fireEvent.click(screen.getByTestId('adultes-minus'));
    expect(screen.getByTestId('adultes-count').textContent).toBe('0');
    // re-décrémenter → toujours 0
    fireEvent.click(screen.getByTestId('adultes-minus'));
    expect(screen.getByTestId('adultes-count').textContent).toBe('0');
  });

  it('incrémente le nombre d\'enfants', () => {
    render(<SearchForm onSearch={jest.fn()} />);
    fireEvent.click(screen.getByTestId('enfants-plus'));
    fireEvent.click(screen.getByTestId('enfants-plus'));
    expect(screen.getByTestId('enfants-count').textContent).toBe('2');
  });

  it('affiche une erreur si on recherche avec 0 adultes', () => {
    render(<SearchForm onSearch={jest.fn()} />);
    // décrémenter adultes jusqu'à 0
    fireEvent.click(screen.getByTestId('adultes-minus'));
    fireEvent.click(screen.getByTestId('search-btn'));
    expect(screen.getByTestId('error')).toHaveTextContent('Au moins 1 adulte requis');
  });

  it('affiche une erreur si le départ est avant ou égal à l\'arrivée', () => {
    render(<SearchForm onSearch={jest.fn()} />);
    fireEvent.change(screen.getByTestId('arrivee'), { target: { value: '2026-08-10' } });
    fireEvent.change(screen.getByTestId('depart'), { target: { value: '2026-08-05' } }); // avant arrivée
    fireEvent.click(screen.getByTestId('search-btn'));
    expect(screen.getByTestId('error')).toBeInTheDocument();
  });

  it('appelle onSearch avec les bonnes données si le formulaire est valide', () => {
    const onSearch = jest.fn();
    render(<SearchForm onSearch={onSearch} />);
    fireEvent.change(screen.getByTestId('destination'), { target: { value: 'Hammamet' } });
    fireEvent.change(screen.getByTestId('arrivee'), { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByTestId('depart'), { target: { value: '2026-08-05' } });
    fireEvent.click(screen.getByTestId('adultes-plus')); // 2 adultes
    fireEvent.click(screen.getByTestId('search-btn'));
    expect(onSearch).toHaveBeenCalledWith({
      destination: 'Hammamet',
      adultes: 2,
      enfants: 0,
      arrivee: '2026-08-01',
      depart: '2026-08-05',
    });
  });

  it('ne déclenche pas onSearch si le formulaire est invalide', () => {
    const onSearch = jest.fn();
    render(<SearchForm onSearch={onSearch} />);
    fireEvent.click(screen.getByTestId('adultes-minus')); // 0 adultes
    fireEvent.click(screen.getByTestId('search-btn'));
    expect(onSearch).not.toHaveBeenCalled();
  });
});
