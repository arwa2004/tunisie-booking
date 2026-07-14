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
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };