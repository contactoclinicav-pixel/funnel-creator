"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, Copy, ExternalLink, Rocket } from "lucide-react";
import { toast } from "sonner";

import {
  publishFunnelAction,
  unpublishFunnelAction,
} from "@/app/(app)/funnels/actions";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PublishControls({
  funnel,
}: {
  funnel: {
    id: string;
    slug: string;
    status: string;
    questionCount: number;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const publicPath = `/f/${funnel.slug}`;

  async function run(
    action: (form: FormData) => Promise<{ error?: string } | undefined>,
    successMessage: string
  ) {
    const form = new FormData();
    form.set("funnelId", funnel.id);
    setBusy(true);
    try {
      const result = await action(form);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      router.refresh();
    } catch {
      toast.error("No se pudo completar la acción. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}${publicPath}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado.");
    } catch {
      toast.info(url);
    }
  }

  if (funnel.status === "ARCHIVED") {
    return null;
  }

  if (funnel.status === "PUBLISHED") {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1.5">
          <Button asChild variant="outline" size="sm">
            <a href={publicPath} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Ver
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="size-4" />
            Copiar enlace
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  run(publishFunnelAction, "Cambios publicados en una nueva versión.")
                }
              >
                <Rocket className="size-4" />
                {busy ? "Publicando…" : "Publicar cambios"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Los cambios del editor no afectan al funnel en vivo hasta
              publicar de nuevo.
            </TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() =>
              run(
                unpublishFunnelAction,
                "Funnel despublicado. La URL pública dejó de funcionar."
              )
            }
          >
            <CloudOff className="size-4" />
            Despublicar
          </Button>
        </div>
      </TooltipProvider>
    );
  }

  const canPublish = funnel.questionCount > 0;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              disabled={busy || !canPublish}
              onClick={() =>
                run(publishFunnelAction, "¡Funnel publicado! Comparte el enlace.")
              }
            >
              <Rocket className="size-4" />
              {busy ? "Publicando…" : "Publicar"}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {canPublish
            ? `Se publicará en ${publicPath}`
            : "Añade al menos una pregunta antes de publicar."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
