export function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="h-80 rounded-[1.5rem] bg-mist" />
        <div className="space-y-4">
          <div className="h-8 w-40 rounded bg-mist" />
          <div className="h-12 w-64 rounded bg-mist" />
          <div className="h-24 rounded-[1.2rem] bg-mist" />
          <div className="h-24 rounded-[1.2rem] bg-mist" />
        </div>
      </div>
      <div className="h-64 rounded-[1.5rem] bg-mist" />
    </div>
  );
}
