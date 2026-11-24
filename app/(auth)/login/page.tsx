import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthSplit } from "@/components/auth/auth-split";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthSplit
      title="Welcome back"
      description="Sign in to continue your style companion — outfits, wardrobe, and grooming in one place."
      panelTitle="Confidence is a daily practice."
      panelCopy="Return to the looks you saved, the preferences you refined, and the next outfit decision waiting for you."
      imageSrc="/images/auth-login-visual.jpg"
      imageAlt="Fashion editorial portrait for the sign-in experience"
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <AuthForm mode="login" />
    </AuthSplit>
  );
}
