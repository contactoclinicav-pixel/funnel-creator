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
    <div className="mx-auto grid max-w-[1180px] gap-6">
      <PageHeader title={title} description={description} />
      <div className="rounded-2xl border border-dashed border-line-soft bg-card px-6 py-16 text-center">
        <p className="display text-[18px] text-ink">Disponible próximamente</p>
        <p className="mx-auto mt-1.5 max-w-sm text-[14.5px] text-ink-primary">
          Esta sección se activará en la {phase} del desarrollo.
        </p>
      </div>
    </div>
  );
}
