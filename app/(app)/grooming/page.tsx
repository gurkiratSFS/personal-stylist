import { ModuleStage } from "@/components/app/module-stage";

export const metadata = { title: "Grooming" };

export default function GroomingPage() {
  return (
    <ModuleStage
      eyebrow="Grooming Studio"
      title="Hair, beard, and care guidance with respect"
      description="Suggestions will be based on your photo and preferences — never medical diagnoses."
      nextStep="Optional face photos and appearance prefs live on Profile. Grooming studio ships in a dedicated phase."
      imageSrc="/images/auth-login-visual.jpg"
    />
  );
}
