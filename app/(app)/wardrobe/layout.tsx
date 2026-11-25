import { WardrobeSubnav } from "@/components/wardrobe/wardrobe-subnav";

export default function WardrobeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <WardrobeSubnav />
      {children}
    </div>
  );
}
