import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description: string;
  action?: string;
  actionHref?: string;
};

export function PageHeader({ title, description, action, actionHref }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Sales workspace</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? (
        <Button nativeButton={!actionHref} render={actionHref ? <Link href={actionHref} /> : undefined} size="lg" className="shadow-lg shadow-primary/15">
          <Plus /> {action}
        </Button>
      ) : null}
    </div>
  );
}
