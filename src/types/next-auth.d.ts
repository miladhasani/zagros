import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone: string;
      mustSetPassword: boolean;
      isSuperAdmin: boolean;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    phone: string;
    mustSetPassword: boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    phone?: string;
    mustSetPassword?: boolean;
    isSuperAdmin?: boolean;
    isAdmin?: boolean;
  }
}
