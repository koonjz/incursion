import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";


export const metadata: Metadata = {
  title: "Sign in | ACM Resolve",
  description: "Sign in to submit events, track reviews and manage the campus calendar.",
};

export default function LoginPage() {
  return <LoginForm />;
}
