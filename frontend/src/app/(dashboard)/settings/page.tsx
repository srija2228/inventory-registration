import { PageHeader } from "@/components/layout/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Application preferences" />
      <div className="max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6 text-sm">
        <div className="flex justify-between border-b border-border pb-4">
          <span className="text-muted-foreground">API URL</span>
          <span className="font-mono text-xs">
            {process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Reservation TTL</span>
          <span>10 minutes (server config)</span>
        </div>
      </div>
    </div>
  );
}
