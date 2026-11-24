import { ModuleStage } from "@/components/app/module-stage";

export const metadata = { title: "My Wardrobe" };

export default function WardrobePage() {
  return (
    <ModuleStage
      eyebrow="Digital Wardrobe"
      title="Catalog what you own. Dress from reality."
      description="Upload pieces, categorize them, and build outfits from clothes already in your closet."
      nextStep="Style DNA and photo vault are ready. Wardrobe item uploads arrive in a later phase."
      imageSrc="/images/preview-wardrobe-ui.jpg"
    />
  );
}
