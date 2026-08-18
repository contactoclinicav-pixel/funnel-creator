"use client";

import { useState } from "react";
import { toast } from "sonner";

import { applyTemplateAction } from "@/app/(app)/templates/actions";
import { Button } from "@/components/ui/button";

export function TemplateCard({
  template,
}: {
  template: {
    id: string;
    name: string;
    description: string | null;
    category: string;
  };
}) {
  const [creating, setCreating] = useState(false);

  async function handleUseTemplate() {
    const form = new FormData();
    form.set("templateId", template.id);
    setCreating(true);
    const result = await applyTemplateAction(form);
    // Si la acción redirige al editor, nunca llegamos aquí.
    setCreating(false);
    if (result?.error) {
      toast.error(result.error);
    }
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-colors transition-brand hover:border-brand">
      <div className="surface-brand-thumb flex h-[110px] flex-col justify-between p-4">
        <span className="micro-label w-fit rounded-full bg-[rgba(231,238,242,.12)] px-2.5 py-1 text-[#B9CCD8]">
          {template.category}
        </span>
        <span className="font-display text-[13px] font-bold lowercase tracking-[-0.05em] text-[#FCFBF9]">
          <span className="text-[#7FA8C4]">ai</span>funnel
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15.5px] font-semibold text-ink">
          {template.name}
        </h3>
        {template.description ? (
          <p className="mt-1.5 flex-1 text-[13px] leading-[1.5] text-ink-primary">
            {template.description}
          </p>
        ) : null}
        <Button
          onClick={handleUseTemplate}
          disabled={creating}
          variant="outline"
          className="mt-4 w-full"
        >
          {creating ? "Creando…" : "Usar template"}
        </Button>
      </div>
    </article>
  );
}
