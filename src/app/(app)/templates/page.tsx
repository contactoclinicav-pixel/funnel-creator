import { PageHeader } from "@/components/layout/page-header";
import { TemplateCard } from "@/components/templates/template-card";
import { requireWorkspace } from "@/server/context";
import { listTemplates } from "@/server/services/template";

export const metadata = { title: "Templates" };

export default async function TemplatesPage() {
  await requireWorkspace();
  const templates = await listTemplates();

  return (
    <div className="mx-auto grid max-w-[1180px] gap-6">
      <PageHeader
        microLabel="empieza rápido"
        title="Templates"
        description="Elige una plantilla probada y personalízala a tu negocio."
      />

      <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
