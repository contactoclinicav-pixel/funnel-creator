export function QuotaReachedScreen({
  businessName,
}: {
  businessName?: string;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold">
        {businessName ? `${businessName} no está recibiendo respuestas por ahora` : "No se están recibiendo respuestas por ahora"}
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Este funnel alcanzó su límite de respuestas de este mes. Vuelve a
        intentarlo el próximo mes.
      </p>
    </div>
  );
}
