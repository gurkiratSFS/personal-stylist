import { AnalyzeSubnav } from "@/components/outfits/analyze-subnav";

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <AnalyzeSubnav />
      {children}
    </div>
  );
}
