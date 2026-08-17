import { CreateAiWizard } from "@/components/create-ai/wizard";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Crear con IA" };

export default function CreateAiPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <PageHeader
        title="Crear con IA"
        description="Describe tu negocio y tu objetivo. La IA crea tu funnel listo para publicar."
      />
      <CreateAiWizard />
    </div>
  );
}
