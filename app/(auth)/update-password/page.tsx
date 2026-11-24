import { AuthForm } from "@/components/auth/auth-form";
import { AuthSplit } from "@/components/auth/auth-split";
import { requireUser } from "@/lib/auth/session";

export const metadata = { title: "Update password" };
export const instant = false;

export default async function UpdatePasswordPage() {
  await requireUser();

  return (
    <AuthSplit
      title="Choose a new password"
      description="Use at least 8 characters. You will return to your home after saving."
      panelTitle="Secure access. Same style profile."
      panelCopy="Your preferences and saved looks stay attached to this account."
      imageSrc="/images/hero-editorial.jpg"
      imageAlt="Editorial fashion photograph"
      footer="Need help? Contact support from the website footer."
    >
      <AuthForm mode="update-password" />
    </AuthSplit>
  );
}
