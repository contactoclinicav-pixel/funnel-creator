import { BrandForm } from "@/components/brand/brand-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/server/context";

export const metadata = { title: "Mi Marca" };

export default async function BrandPage() {
  const ctx = await requireWorkspace();
  const brand = await prisma.brandSettings.findUnique({
    where: { workspaceId: ctx.workspaceId },
  });

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader
        title="Mi Marca"
        description="Logo, colores y datos de contacto para aplicar a tus funnels con un clic."
      />
      <Card>
        <CardContent>
          <BrandForm
            brand={{
              businessName: brand?.businessName ?? "",
              logoUrl: brand?.logoUrl ?? "",
              primaryColor: brand?.primaryColor ?? "",
              secondaryColor: brand?.secondaryColor ?? "",
              font: brand?.font ?? "",
              website: brand?.website ?? "",
              whatsapp: brand?.whatsapp ?? "",
              email: brand?.email ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
