import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthSplit } from "@/components/auth/auth-split";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthSplit
      title="Create your account"
      description="Start with email and password. Locale preferences and deeper style DNA follow inside the app."
      panelTitle="Discover the style that feels like you."
      panelCopy="Personal Stylist learns your preferences so recommendations stay useful — never generic."
      imageSrc="/images/auth-signup-visual.jpg"
      imageAlt="Lifestyle fashion photograph for the signup experience"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" />
    </AuthSplit>
  );
}
