import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthSplit } from "@/components/auth/auth-split";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthSplit
      title="Reset your password"
      description="Enter your email and we will send a secure link to choose a new password."
      panelTitle="Back into your wardrobe in a moment."
      panelCopy="Password recovery keeps your looks, preferences, and progress intact."
      imageSrc="/images/lifestyle-mood.jpg"
      imageAlt="Fashion mood board for password recovery"
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <AuthForm mode="forgot" />
    </AuthSplit>
  );
}
