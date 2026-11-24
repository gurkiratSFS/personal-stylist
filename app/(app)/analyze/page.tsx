import { ModuleStage } from "@/components/app/module-stage";

export const metadata = { title: "Outfit Analyzer" };

export default function AnalyzePage() {
  return (
    <ModuleStage
      eyebrow="Outfit Analyzer"
      title="Upload a look. Get guidance you can use."
      description="This module will score color, fit, footwear, and accessories with structured AI feedback — never fake sample scores."
      nextStep="Complete Style DNA essentials on Profile. Outfit upload and analysis ship in a dedicated phase."
      imageSrc="/images/preview-outfit-ui.jpg"
    />
  );
}
