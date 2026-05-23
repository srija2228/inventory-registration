import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Support" subtitle="We're here to help" />
      <div className="rounded-2xl border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">
          For demo issues, verify the backend API is running and database credentials in{" "}
          <code className="rounded bg-muted px-1">backend/.env</code> are correct.
        </p>
        <Button className="mt-6 rounded-full" asChild>
          <a href="mailto:support@allo.inventory">Email support</a>
        </Button>
      </div>
    </div>
  );
}
