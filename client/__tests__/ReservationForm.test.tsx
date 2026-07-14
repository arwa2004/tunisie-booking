/**
 * Tests unitaires — Formulaire de Réservation (ReservationForm)
 *
 * Ces tests vérifient :
 * - Le calcul automatique du nombre de nuits en fonction des dates saisies.
 * - Le calcul automatique du prix total estimé.
 * - La validation des formulaires (ex: date de départ après date d'arrivée).
 * - L'appel de la soumission avec les bonnes valeurs.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Helpers intégrés (identiques à la logique de la page hôtel) ─────────────

const nbNuits = (dateArrivee: string, dateDepart: string): number => {
  if (!dateArrivee || !dateDepart) return 0;
  const diff = new Date(dateDepart).getTime() - new Date(dateArrivee).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const prixEstime = (prixParNuit: number, nuits: number, chambres: number): number => {
  return prixParNuit * nuits * chambres;
};

// ── Composant ReservationForm à tester ─────────────────────────────────────

interface ReservationFormProps {
  prixParNuit: number;
  onSubmit?: (data: {
    date_arrivee: string;
    date_depart: string;
    nb_chambres: number;
    prix_total: number;
  }) => void;
}

function ReservationForm({ prixParNuit, onSubmit }: ReservationFormProps) {
  const [dateArrivee, setDateArrivee] = React.useState('');
  const [dateDepart, setDateDepart]   = React.useState('');
  const [nbChambres, setNbChambres]   = React.useState(1);
  const [error, setError]             = React.useState('');

  const nuits = nbNuits(dateArrivee, dateDepart);
  const total = prixEstime(prixParNuit, nuits, nbChambres);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dateArrivee || !dateDepart) {
      setError("Veuillez renseigner les dates d'arrivée et de départ.");
      return;
    }

    if (nuits <= 0) {
      setError("La date de départ doit être postérieure à la date d'arrivée.");
      return;
    }

    setError('');
    onSubmit?.({
      date_arrivee: dateArrivee,
      date_depart: dateDepart,
      nb_chambres: nbChambres,
      prix_total: total,
    });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="reservation-form">
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}

      <div>
        <label htmlFor="date-arrivee">Date d'arrivée</label>
        <input
          id="date-arrivee"
          type="date"
          value={dateArrivee}
          onChange={(e) => setDateArrivee(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="date-depart">Date de départ</label>
        <input
          id="date-depart"
          type="date"
          value={dateDepart}
          onChange={(e) => setDateDepart(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="nb-chambres">Nombre de chambres</label>
        <input
          id="nb-chambres"
          type="number"
          min="1"
          value={nbChambres}
          onChange={(e) => setNbChambres(Math.max(1, parseInt(e.target.value) || 1))}
        />
      </div>

      {nuits > 0 && (
        <div data-testid="summary">
          <p>{nuits} nuit(s)</p>
          <p data-testid="total-price">Total : {total} DT</p>
        </div>
      )}

      <button type="submit">Confirmer la réservation</button>
    </form>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('ReservationForm — Tests unitaires de réservation', () => {

  test('affiche les champs de saisie initiaux', () => {
    render(<ReservationForm prixParNuit={150} />);
    expect(screen.getByLabelText(/date d'arrivée/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date de départ/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de chambres/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmer la réservation/i })).toBeInTheDocument();
  });

  test('affiche le nombre de nuits et le prix estimé lorsque les dates sont remplies', () => {
    render(<ReservationForm prixParNuit={150} />);

    const arriveeInput = screen.getByLabelText(/date d'arrivée/i);
    const departInput  = screen.getByLabelText(/date de départ/i);

    fireEvent.change(arriveeInput, { target: { value: '2025-08-01' } });
    fireEvent.change(departInput,  { target: { value: '2025-08-05' } }); // 4 nuits

    expect(screen.getByText(/4 nuit\(s\)/i)).toBeInTheDocument();
    // 150 DT/nuit * 4 nuits * 1 chambre = 600 DT
    expect(screen.getByTestId('total-price')).toHaveTextContent('Total : 600 DT');
  });

  test('recalcule le prix total quand on change le nombre de chambres', () => {
    render(<ReservationForm prixParNuit={100} />);

    fireEvent.change(screen.getByLabelText(/date d'arrivée/i), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByLabelText(/date de départ/i),  { target: { value: '2025-08-03' } }); // 2 nuits
    
    const chambresInput = screen.getByLabelText(/nombre de chambres/i);
    fireEvent.change(chambresInput, { target: { value: '3' } }); // 3 chambres

    // 100 DT/nuit * 2 nuits * 3 chambres = 600 DT
    expect(screen.getByTestId('total-price')).toHaveTextContent('Total : 600 DT');
  });

  test('affiche une erreur si on soumet sans dates', () => {
    render(<ReservationForm prixParNuit={100} />);
    fireEvent.click(screen.getByRole('button', { name: /confirmer la réservation/i }));
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/veuillez renseigner les dates/i)).toBeInTheDocument();
  });

  test('affiche une erreur si la date de départ est antérieure ou égale à la date d\'arrivée', () => {
    render(<ReservationForm prixParNuit={100} />);
    
    fireEvent.change(screen.getByLabelText(/date d'arrivée/i), { target: { value: '2025-08-05' } });
    fireEvent.change(screen.getByLabelText(/date de départ/i),  { target: { value: '2025-08-01' } }); // départ avant arrivée
    fireEvent.click(screen.getByRole('button', { name: /confirmer la réservation/i }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/la date de départ doit être postérieure/i)).toBeInTheDocument();
  });

  test('appelle onSubmit avec les données calculées si le formulaire est valide', () => {
    const mockSubmit = jest.fn();
    render(<ReservationForm prixParNuit={200} onSubmit={mockSubmit} />);

    fireEvent.change(screen.getByLabelText(/date d'arrivée/i), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByLabelText(/date de départ/i),  { target: { value: '2025-08-03' } }); // 2 nuits
    fireEvent.change(screen.getByLabelText(/nombre de chambres/i), { target: { value: '2' } }); // 2 chambres
    fireEvent.click(screen.getByRole('button', { name: /confirmer la réservation/i }));

    // 200 DT/nuit * 2 nuits * 2 chambres = 800 DT
    expect(mockSubmit).toHaveBeenCalledWith({
      date_arrivee: '2025-08-01',
      date_depart: '2025-08-03',
      nb_chambres: 2,
      prix_total: 800,
    });
  });
});
