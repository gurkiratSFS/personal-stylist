import { ModuleStage } from "@/components/app/module-stage";

export const metadata = { title: "AI Assistant" };

export default function AssistantPage() {
  return (
    <ModuleStage
      eyebrow="AI Assistant"
      title="Conversation with real app actions"
      description="The assistant will answer questions and call allowlisted tools — analyze outfits, update preferences, search products — never raw SQL."
      nextStep="Use Home and Profile today. Chat arrives after the modules it needs to call."
      imageSrc="/images/preview-outfit-ui.jpg"
    />
  );
}
