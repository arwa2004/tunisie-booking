/**
 * Tests unitaires — Page d'Inscription (RegisterPage)
 *
 * Ces tests vérifient :
 * - Le rendu de tous les champs de saisie de l'inscription (Nom, Prénom, Téléphone, Email, etc.).
 * - La saisie utilisateur sur chacun de ces champs.
 * - Le comportement lors de la soumission du formulaire (appel fetch API).
 * - L'affichage des messages d'erreur renvoyés par le serveur Laravel.
 * - Le comportement en cas de succès (sauvegarde localStorage et redirection).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../src/app/register/page';

// ── Mocks Next.js et NextAuth ──────────────────────────────────────────────

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      replace: jest.fn(),
    };
  },
  usePathname() {
    return '/register';
  },
}));

jest.mock('next-auth/react', () => ({
  useSession() {
    return { data: null, status: 'unauthenticated' };
  },
}));

// On mocke Navbar et Footer pour isoler le test de la page Register
jest.mock('@/components/Navbar', () => () => <div data-testid="mock-navbar" />);
jest.mock('@/components/Footer', () => () => <div data-testid="mock-footer" />);

describe('RegisterPage — Tests unitaires de la page d\'inscription', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // On mocke la fonction fetch globale
    global.fetch = jest.fn();
  });

  // ── Rendu initial ────────────────────────────────────────────────────────

  test('affiche tous les champs de saisie requis', () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/^nom$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^prénom$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^téléphone$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirmer le mot de passe$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /créer mon compte/i })).toBeInTheDocument();
  });

  // ── Saisie des utilisateurs ───────────────────────────────────────────────

  test('met à jour les champs de saisie', () => {
    render(<RegisterPage />);

    const nomInput = screen.getByLabelText(/^nom$/i) as HTMLInputElement;
    const prenomInput = screen.getByLabelText(/^prénom$/i) as HTMLInputElement;
    const telInput = screen.getByLabelText(/^téléphone$/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/^email$/i) as HTMLInputElement;

    fireEvent.change(nomInput, { target: { value: 'Ben Ali' } });
    fireEvent.change(prenomInput, { target: { value: 'Ahmed' } });
    fireEvent.change(telInput, { target: { value: '+21699888777' } });
    fireEvent.change(emailInput, { target: { value: 'ahmed@test.com' } });

    expect(nomInput.value).toBe('Ben Ali');
    expect(prenomInput.value).toBe('Ahmed');
    expect(telInput.value).toBe('+21699888777');
    expect(emailInput.value).toBe('ahmed@test.com');
  });

  // ── Soumission avec erreur serveur ────────────────────────────────────────

  test('affiche le message d\'erreur envoyé par le serveur en cas d\'échec', async () => {
    // On simule une erreur de validation renvoyée par Laravel (ex: email déjà pris)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        message: "Les données fournies ne sont pas valides.",
        errors: {
          email: ["L'adresse email est déjà utilisée."]
        }
      })
    });

    render(<RegisterPage />);

    // Remplir les champs
    fireEvent.change(screen.getByLabelText(/^nom$/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/^prénom$/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/^téléphone$/i), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'pris@test.com' } });
    fireEvent.change(screen.getByLabelText(/^mot de passe/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/^confirmer le mot de passe/i), { target: { value: 'password123' } });

    // Soumettre le formulaire
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));

    // On attend que l'erreur s'affiche
    await waitFor(() => {
      expect(screen.getByText("L'adresse email est déjà utilisée.")).toBeInTheDocument();
    });
  });

  // ── Soumission réussie ────────────────────────────────────────────────────

  test('stocke les données d\'authentification et redirige en cas de succès', async () => {
    // On simule une inscription réussie renvoyant le token et l'utilisateur
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: "fake-jwt-token",
        user: {
          id: 42,
          nom: "Ben Ali",
          prenom: "Ahmed",
          email: "ahmed@test.com",
          role: "client"
        }
      })
    });

    // Espionner la fonction de dispatch d'événements
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    render(<RegisterPage />);

    // Remplir les champs obligatoires
    fireEvent.change(screen.getByLabelText(/^nom$/i), { target: { value: 'Ben Ali' } });
    fireEvent.change(screen.getByLabelText(/^prénom$/i), { target: { value: 'Ahmed' } });
    fireEvent.change(screen.getByLabelText(/^téléphone$/i), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'ahmed@test.com' } });
    fireEvent.change(screen.getByLabelText(/^mot de passe/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/^confirmer le mot de passe/i), { target: { value: 'password123' } });

    // Cliquer sur le bouton de soumission
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));

    // Vérifier les actions après succès
    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("fake-jwt-token");
      expect(JSON.parse(localStorage.getItem("user") || "{}").nom).toBe("Ben Ali");
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});
