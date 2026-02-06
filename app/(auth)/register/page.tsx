import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
