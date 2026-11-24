import { ModuleStage } from "@/components/app/module-stage";

export const metadata = { title: "Shopping" };

export default function ShoppingPage() {
  return (
    <ModuleStage
      eyebrow="Smart Shopping"
      title="Products from real marketplaces"
      description="Search and wishlists will use authentic prices, ratings, and disclosed affiliate links — never a fake catalog."
      nextStep="Set your currency on Profile. Marketplace search connects in a later phase."
      imageSrc="/images/lifestyle-mood.jpg"
    />
  );
}
