import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Access restricted" };

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <CardTitle>Access restricted</CardTitle>
          <CardDescription>Your current role does not have permission to open this area.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Back to dashboard</Link>
        </CardContent>
      </Card>
    </main>
  );
}
