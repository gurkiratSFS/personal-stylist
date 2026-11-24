import Image from "next/image";
import Link from "next/link";

export function AuthSplit({
  title,
  description,
  panelTitle,
  panelCopy,
  imageSrc,
  imageAlt,
  children,
  footer,
}: {
  title: string;
  description: string;
  panelTitle: string;
  panelCopy: string;
  imageSrc: string;
  imageAlt: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative h-48 overflow-hidden sm:h-56 lg:hidden">
        <Image src={imageSrc} alt={imageAlt} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-1 p-5 text-white">
          <p className="text-[10px] tracking-[0.2em] text-white/70 uppercase">
            Personal Stylist
          </p>
          <p className="font-display text-xl leading-snug">{panelTitle}</p>
        </div>
      </div>

      <div className="flex min-h-svh flex-col justify-center overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
        <Link href="/" className="font-display text-2xl tracking-tight">
          Personal Stylist
        </Link>
        <div className="mt-10 max-w-md space-y-3">
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="mt-8 max-w-md">{children}</div>
        <div className="mt-8 max-w-md text-sm text-muted-foreground">{footer}</div>
      </div>

      <aside className="relative hidden h-svh overflow-hidden lg:sticky lg:top-0 lg:block">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-10 text-white">
          <p className="text-xs tracking-[0.2em] text-white/70 uppercase">
            Personal Stylist
          </p>
          <h2 className="max-w-md font-display text-3xl leading-tight">
            {panelTitle}
          </h2>
          <p className="max-w-md text-sm text-white/75">{panelCopy}</p>
        </div>
      </aside>
    </div>
  );
}
