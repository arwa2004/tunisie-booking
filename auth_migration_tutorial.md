# 📚 Tutoriel : Migration vers Laravel Breeze + Socialite + NextAuth.js

Ce guide pas-à-pas vous explique comment mettre en place l'authentification sécurisée et robuste en effectuant vous-même les changements pour bien assimiler la logique de chaque brique.

---

## Étape 1 : Préparation du Back-end (Laravel)

### 1.1 Installer les packages nécessaires
Ouvrez votre terminal dans le dossier `server/` et lancez les deux commandes suivantes :
```bash
composer require laravel/breeze --dev
composer require laravel/socialite
```

### 1.2 Initialiser Laravel Breeze (Stack API)
Lancez la commande d'installation Breeze pour une API sans interface d'authentification intégrée (car c'est Next.js qui va gérer l'interface) :
```bash
php artisan breeze:install api
```
> **Que fait cette commande ?**
> - Elle génère des contrôleurs robustes dans `app/Http/Controllers/Auth/` (login, register, gestion du mot de passe oublié).
> - Elle crée des classes de requêtes (`LoginRequest` dans `app/Http/Requests/Auth/`) pour valider les données de connexion.
> - Elle configure des routes standardisées d'authentification dans le fichier `routes/auth.php`.

---

## Étape 2 : Adapter Laravel Breeze à vos données existantes

La base de données TunisieBooking a des champs spécifiques (`nom`, `prenom`, `telephone`) alors que Breeze ne gère par défaut que (`name`, `email`, `password`). Nous allons adapter les contrôleurs générés.

### 2.1 Modifier l'Inscription (`RegisteredUserController.php`)
Modifiez le fichier `server/app/Http/Controllers/Auth/RegisteredUserController.php` pour valider vos champs personnalisés et retourner le jeton Sanctum pour NextAuth.js.

Remplacez le contenu par :
```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'telephone' => ['required', 'string', 'max:20'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'telephone' => $request->telephone,
            'email' => $request->email,
            'password' => Hash::make($request->string('password')),
            'role' => 'client', // Valeur par défaut
        ]);

        event(new Registered($user));

        // Création du token Sanctum que NextAuth conservera en session
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }
}
```

### 2.2 Modifier la Connexion (`AuthenticatedSessionController.php`)
Par défaut, Breeze API renvoie une réponse vide (`204 No Content`) après la connexion en mode cookie. Comme NextAuth.js s'exécute côté serveur de Next, il a besoin de récupérer le token d'API.

Modifiez `server/app/Http/Controllers/Auth/AuthenticatedSessionController.php` :
```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        $user = $request->user();
        
        // Supprime les anciens tokens pour éviter les doublons
        $user->tokens()->delete();
        
        // Génère le nouveau token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): JsonResponse
    {
        // Supprime le token actuel
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté avec succès']);
    }
}
```

---

## Étape 3 : Configurer Laravel Socialite (Connexions Sociales)

Socialite permet de déléguer la validation OAuth aux réseaux comme Google ou Facebook.

### 3.1 Configurer les providers (`config/services.php`)
Ajoutez vos clés d'API (ex: Google) à la fin du fichier `server/config/services.php` :
```php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
],
```

### 3.2 Créer le contrôleur de connexion sociale (`SocialAuthController.php`)
Créez un nouveau fichier `server/app/Http/Controllers/Api/SocialAuthController.php` :
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SocialAuthController extends Controller
{
    /**
     * Gère l'authentification sociale reçue depuis NextAuth.js
     */
    public function handleSocialLogin(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'provider' => 'required|string',
            'provider_id' => 'required|string',
        ]);

        // Recherche l'utilisateur par son email
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Crée l'utilisateur si absent
            $user = User::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'telephone' => 'N/A',
                'password' => Hash::make(Str::random(24)), // Mot de passe aléatoire sécurisé
                'role' => 'client',
            ]);
        }

        // Génère le token Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }
}
```

### 3.3 Ajouter la route dans `server/routes/api.php`
Ajoutez cette ligne dans vos routes publiques de `api.php` :
```php
Route::post('/auth/social', [\App\Http\Controllers\Api\SocialAuthController::class, 'handleSocialLogin']);
```

---

## Étape 4 : Front-end Next.js (NextAuth.js)

### 4.1 Installer NextAuth dans Next.js
Allez dans le dossier `client/` de votre terminal et installez le package :
```bash
npm install next-auth
```

### 4.2 Créer le point d'entrée API NextAuth
Créez le répertoire et le fichier `client/src/app/api/auth/[...nextauth]/route.ts` :
```typescript
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const authOptions: NextAuthOptions = {
  providers: [
    // 1. Authentification par Identifiants (Laravel Breeze)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();
          if (res.ok && data.token) {
            // Retourne le user combiné avec le token d'API Laravel
            return {
              ...data.user,
              accessToken: data.token,
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
    // 2. Connexion Google (Socialite / OAuth)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    // Exécuté lors du login social pour lier le compte avec Laravel
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const nameParts = user.name?.split(" ") || ["", ""];
          const prenom = nameParts[0];
          const nom = nameParts.slice(1).join(" ") || "Client";

          const res = await fetch(`${API_URL}/auth/social`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              nom: nom,
              prenom: prenom,
              provider: "google",
              provider_id: account.providerAccountId,
            }),
          });

          const data = await res.json();
          if (res.ok && data.token) {
            // Stocke le token reçu du back-end dans l'objet utilisateur
            (user as any).accessToken = data.token;
            (user as any).role = data.user.role;
            (user as any).nom = data.user.nom;
            (user as any).prenom = data.user.prenom;
            return true;
          }
        } catch (error) {
          console.error("Erreur de synchronisation Socialite:", error);
          return false;
        }
      }
      return true;
    },
    // Stocke les données de l'utilisateur et le token dans le JWT chiffré NextAuth
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.nom = (user as any).nom;
        token.prenom = (user as any).prenom;
      }
      return token;
    },
    // Rend les données accessibles via le hook useSession() dans vos pages React
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).role = token.role;
        (session.user as any).nom = token.nom;
        (session.user as any).prenom = token.prenom;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## Étape 5 : Connecter la session globale de Next.js

Pour que tous vos composants (comme le `Navbar`) puissent utiliser la session NextAuth, il faut entourer l'application d'un composant Provider.

### 5.1 Créer un wrapper de Session client
Créez le fichier `client/src/components/SessionProviderWrapper.tsx` :
```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

### 5.2 Mettre à jour `client/src/app/layout.tsx`
Entourez votre structure par le wrapper :
```typescript
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
// ... (autres imports)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#f8f9fa] text-[#1a1a2e]">
        <SessionProviderWrapper>
          <ConditionalMain>{children}</SessionProviderWrapper>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
```

---

## Étape 6 : Remplacer l'usage de localStorage par NextAuth

Une fois la session en place, vous pouvez nettoyer vos pages du stockage non-sécurisé `localStorage`.

### 6.1 Mettre à jour le Navbar (`Navbar.tsx`)
Au lieu de lire `localStorage`, utilisez le hook de NextAuth :
```typescript
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === "loading";
  
  // logout :
  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };
  
  // Utilisez `user` directement au lieu de stocker l'état dans un useEffect !
}
```

Grâce à cette approche, le statut d'authentification est géré de manière fluide : dès que `signOut()` ou le login se termine, tous les composants utilisant `useSession()` se mettent à jour automatiquement !
