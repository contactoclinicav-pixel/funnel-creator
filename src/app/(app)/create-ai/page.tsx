import Link from "next/link";
import { Hourglass, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Crear con IA" };

export default function CreateAiPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        title="Crear con IA"
        description="Describe tu negocio y tu objetivo. La IA crea tu funnel listo para publicar."
      />
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-background py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Hourglass className="size-6 text-muted-foreground" />
        </span>
        <div>
          <p className="font-medium">Disponible próximamente</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            El generador con IA se activará en la Fase 7 del desarrollo.
            Mientras tanto puedes crear un funnel en blanco.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/funnels?nuevo=1">
            <Plus className="size-4" />
            Crear funnel en blanco
          </Link>
        </Button>
      </div>
    </div>
  );
}
