import Link from "next/link";

export default function FunnelNotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold">Este funnel no está disponible</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Puede que el enlace sea incorrecto o que el funnel ya no esté
        publicado.
      </p>
      <Link
        href="/"
        className="mt-2 text-sm underline underline-offset-4 hover:text-foreground"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
