import { connection } from "next/server";
import { notFound } from "next/navigation";

import { AnalysisReport } from "@/components/outfits/analysis-report";
import { isVisionConfigured } from "@/lib/ai/vision/factory";
import { requireUser } from "@/lib/auth/session";
import { getAnalysisDetail } from "@/lib/outfits/service";

export const metadata = { title: "Outfit report" };
export const instant = false;

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  await connection();
  const user = await requireUser();
  const { analysisId } = await params;
  const detail = await getAnalysisDetail(user.id, analysisId);
  if (!detail || !detail.outfit) notFound();

  return (
    <div className="space-y-6">
      <AnalysisReport
        analysis={detail.analysis}
        outfit={detail.outfit}
        recommendations={detail.recommendations}
        followUps={detail.followUps}
        signedUrl={detail.signedUrl}
        saved={Boolean(detail.savedLook)}
        visionReady={isVisionConfigured()}
      />
    </div>
  );
}
