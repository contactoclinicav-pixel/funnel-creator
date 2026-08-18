import { CreateAiWizard } from "@/components/create-ai/wizard";

export const metadata = { title: "Crear con IA" };

export default function CreateAiPage() {
  return (
    <div className="py-2">
      <CreateAiWizard />
    </div>
  );
}
