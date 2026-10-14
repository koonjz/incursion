import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign up | ACM Resolve",
  description: "Create an account on ACM Resolve to manage and schedule campus events without conflicts.",
};

export default function SignupPage() {
  return <SignupForm />;
}
