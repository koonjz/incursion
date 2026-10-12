import { DefaultSession } from "next-auth";
import { UserRole } from "@/src/modules/auth/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isActive: boolean;
      department?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: UserRole;
    isActive?: boolean;
    department?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    isActive?: boolean;
    department?: string | null;
  }
}
