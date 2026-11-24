export default function AppLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 py-2">
      <div className="h-10 w-64 rounded-lg bg-mist" />
      <div className="h-24 rounded-2xl bg-mist" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 rounded-2xl bg-mist" />
        <div className="h-40 rounded-2xl bg-mist" />
      </div>
    </div>
  );
}
