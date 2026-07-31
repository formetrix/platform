import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="shadow-soft mx-auto max-w-lg border-dashed">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted flex flex-col gap-3 text-sm">
        <p>{description}</p>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="text-primary w-fit text-sm font-medium underline-offset-4 hover:underline"
          >
            {actionLabel}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
