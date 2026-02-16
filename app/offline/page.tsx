export default function OfflinePage() {
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">You’re offline</h1>
      <p className="opacity-80 mt-2">
        Costwise can’t sync right now. When you’re back online, reload and your
        data will update.
      </p>
    </div>
  );
}
