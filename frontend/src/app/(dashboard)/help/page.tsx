import { PageHeader } from "@/components/layout/page-header";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Help" subtitle="How the reservation flow works" />
      <div className="prose prose-sm max-w-none rounded-2xl border border-border bg-card p-8 text-foreground">
        <ol className="list-decimal space-y-3 pl-4 text-muted-foreground">
          <li>Browse <strong className="text-foreground">Products</strong>, click Reserve, and pick a warehouse in the side sheet.</li>
          <li>Stock is held as <strong className="text-foreground">PENDING</strong> until the timer expires.</li>
          <li>
            <strong className="text-foreground">Confirm purchase</strong> to permanently deduct inventory, or
            cancel to release units.
          </li>
          <li>Duplicate API requests are safe — idempotency keys prevent double booking.</li>
        </ol>
      </div>
    </div>
  );
}
