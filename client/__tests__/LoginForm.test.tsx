/**
 * Tests unitaires — Formulaire de Connexion (Login)
 *
 * Ces tests vérifient le comportement des éléments UI :
 * - Les champs (email, mot de passe)
 * - Le bouton "Se connecter"
 * - Les messages d'erreur affichés à l'utilisateur
 *
 * On utilise React Testing Library qui monte le composant dans un navigateur
 * virtuel (jsdom) en mémoire, sans ouvrir un vrai navigateur.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Composant à tester (version simplifiée du formulaire de login) ─────────
// En production ce composant se trouve dans src/app/login/page.tsx.
// Ici on le copie en version minimale pour tester la logique UI pure.

function LoginForm({ onSubmit }: { onSubmit?: (data: { email: string; password: string }) => void }) {
  const [email, setEmail]       = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError]       = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Règle : Les deux champs doivent être remplis
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    // Règle : Le mot de passe doit faire au moins 6 caractères
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    setError('');
    onSubmit?.({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Adresse email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="votre@email.com"
      />

      <label htmlFor="password">Mot de passe</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      {error && <p role="alert">{error}</p>}

      <button type="submit">Se connecter</button>
    </form>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('LoginForm — Tests unitaires du formulaire de connexion', () => {

  // ── Rendu initial ────────────────────────────────────────────────────────

  test('affiche le champ email', () => {
    render(<LoginForm />);
    // screen.getByLabelText : trouve l'input associé au label "Adresse email"
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
  });

  test('affiche le champ mot de passe', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  test('affiche le bouton "Se connecter"', () => {
    render(<LoginForm />);
    // screen.getByRole : trouve un élément par son rôle HTML (button, heading, etc.)
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  test('les champs sont vides au départ', () => {
    render(<LoginForm />);
    const emailInput    = screen.getByLabelText(/adresse email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/mot de passe/i)  as HTMLInputElement;
    // toHaveValue : vérifie la valeur actuelle d'un champ de formulaire
    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
  });

  // ── Saisie de l'utilisateur ───────────────────────────────────────────────

  test('met à jour le champ email quand on tape', () => {
    render(<LoginForm />);
    const input = screen.getByLabelText(/adresse email/i);
    // fireEvent.change : simule la saisie d'une valeur dans un champ
    fireEvent.change(input, { target: { value: 'test@gmail.com' } });
    expect((input as HTMLInputElement).value).toBe('test@gmail.com');
  });

  test('met à jour le champ mot de passe quand on tape', () => {
    render(<LoginForm />);
    const input = screen.getByLabelText(/mot de passe/i);
    fireEvent.change(input, { target: { value: 'monmotdepasse' } });
    expect((input as HTMLInputElement).value).toBe('monmotdepasse');
  });

  // ── Validation et messages d'erreur ──────────────────────────────────────

  test('affiche une erreur si on clique sans remplir les champs', () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    // toBeInTheDocument : vérifie que l'élément est présent dans le DOM
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/veuillez remplir tous les champs/i)).toBeInTheDocument();
  });

  test('affiche une erreur si le mot de passe est trop court (moins de 6 caractères)', () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/adresse email/i),    { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i),     { target: { value: '123' } }); // trop court
    fireEvent.click(screen.getByRole('button',  { name: /se connecter/i }));
    expect(screen.getByText(/au moins 6 caractères/i)).toBeInTheDocument();
  });

  test("n'affiche pas d'erreur si le formulaire est valide", () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/adresse email/i),  { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i),   { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    // queryByRole retourne null si l'élément n'existe pas (contrairement à getByRole qui lève une erreur)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // ── Callback ──────────────────────────────────────────────────────────────

  test('appelle onSubmit avec les bonnes données si le formulaire est valide', () => {
    // jest.fn() crée une fonction espion pour vérifier si elle a été appelée
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);

    fireEvent.change(screen.getByLabelText(/adresse email/i),  { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i),   { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    // toHaveBeenCalledWith : vérifie que la fonction a été appelée avec les bons arguments
    expect(mockSubmit).toHaveBeenCalledWith({
      email:    'admin@test.com',
      password: 'secret123',
    });
  });

  test("n'appelle pas onSubmit si le formulaire est invalide", () => {
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    // not.toHaveBeenCalled : vérifie que la fonction n'a PAS été appelée
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
