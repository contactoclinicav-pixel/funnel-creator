import { Hourglass } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-background py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Hourglass className="size-6 text-muted-foreground" />
        </span>
        <div>
          <p className="font-medium">Disponible próximamente</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Esta sección se activará en la {phase} del desarrollo.
          </p>
        </div>
      </div>
    </div>
  );
}
