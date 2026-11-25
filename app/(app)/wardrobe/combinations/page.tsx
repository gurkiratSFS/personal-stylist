import { connection } from "next/server";

import { CombinationBuilder } from "@/components/wardrobe/combination-builder";
import { CombinationList } from "@/components/wardrobe/combination-list";
import { GenerateCombinationsForm } from "@/components/wardrobe/generate-form";
import { WardrobeSetupRequired } from "@/components/wardrobe/setup-required";
import { isVisionConfigured } from "@/lib/ai/vision/factory";
import { requireUser } from "@/lib/auth/session";
import { listCombinations, listWardrobeItems } from "@/lib/wardrobe/service";

export const metadata = { title: "Outfit combinations" };
export const instant = false;

export default async function WardrobeCombinationsPage() {
  await connection();
  const user = await requireUser();
  const visionReady = isVisionConfigured();
  const [items, combinations] = await Promise.all([
    listWardrobeItems(user.id),
    listCombinations(user.id),
  ]);
  const readyItems = items.filter((item) => item.status === "ready");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Combinations</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Build looks from clothes you own, or ask AI to propose combinations from your
          closet. Favorite keepers and discard the rest.
        </p>
      </div>

      {!visionReady ? <WardrobeSetupRequired /> : null}

      <GenerateCombinationsForm
        readyCount={readyItems.length}
        visionReady={visionReady}
      />

      <CombinationBuilder items={readyItems} />

      <section className="space-y-4">
        <h2 className="font-display text-2xl tracking-tight">Saved looks</h2>
        <CombinationList combinations={combinations} />
      </section>
    </div>
  );
}
