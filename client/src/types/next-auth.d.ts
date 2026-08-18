import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    user: {
      id?: string;
      name?: string;
      email?: string;
      image?: string;
      role?: "admin" | "client" | undefined;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    role?: "admin" | "client" | undefined;
    name?: string;
    email?: string;
    emailVerified?: boolean;
  }
}
