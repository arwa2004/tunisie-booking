import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

/**
 * Décode la partie "payload" d'un JWT (sans vérifier la signature).
 * Utilisé pour extraire les rôles Keycloak (realm_access.roles).
 */
function decodeJwt(token: string): any {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const handler = NextAuth({
  providers: [
    KeycloakProvider({
      clientId:     process.env.KEYCLOAK_CLIENT_ID     ?? "nextjs-frontend",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
      issuer:       process.env.KEYCLOAK_ISSUER        ?? "http://localhost:8080/realms/tunisie-booking",
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account, profile }) {
      // Première connexion (account est présent) → on extrait le rôle Keycloak
      if (account) {
        token.accessToken = account.access_token;
        token.idToken     = account.id_token;

        // Rôle depuis le token d'accès Keycloak (realm_access.roles)
        let role: "admin" | "client" | undefined;
        if (account.access_token) {
          const decoded = decodeJwt(account.access_token);
          const roles: string[] = decoded?.realm_access?.roles ?? [];
          role = roles.includes("admin") ? "admin" : roles.length ? "client" : undefined;
        }
        token.role = role;

        // Nom / email depuis le profil Keycloak (ou bien le token)
        if (profile?.email) token.email = profile.email as string;
        if (profile?.name)  token.name  = profile.name as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.idToken = token.idToken as string;
      session.user.role = token.role as "admin" | "client" | undefined;
      if (token.name)  session.user.name  = token.name as string;
      if (token.email) session.user.email = token.email as string;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
