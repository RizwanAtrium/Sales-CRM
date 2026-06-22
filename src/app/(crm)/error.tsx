"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CrmError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("CRM page load failed", error);
  }, [error]);

  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <CardTitle>Page access refreshed</CardTitle>
          <CardDescription>
            Your previous role session was cleared. Reload this page or return to the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-2">
          <Button onClick={() => reset()}><RotateCcw /> Reload</Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>Dashboard</Button>
        </CardContent>
      </Card>
    </div>
  );
}
