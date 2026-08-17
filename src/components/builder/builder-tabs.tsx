"use client";

import { CtaTab } from "@/components/builder/cta-tab";
import { PreviewPane } from "@/components/builder/preview-pane";
import { DesignTab } from "@/components/builder/design-tab";
import { LeadsTab } from "@/components/builder/leads-tab";
import { LogicTab } from "@/components/builder/logic-tab";
import { QuestionsTab } from "@/components/builder/questions-tab";
import { ResultsTab } from "@/components/builder/results-tab";
import { FunnelSettingsForm } from "@/components/funnels/funnel-settings-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { FunnelSnapshot } from "@/lib/funnel-config";

export function BuilderTabs({
  snapshot,
  settings,
}: {
  snapshot: FunnelSnapshot;
  settings: {
    id: string;
    name: string;
    slug: string;
    goal: string | null;
    industry: string | null;
    audience: string | null;
  };
}) {
  const funnelId = snapshot.funnelId;

  return (
    <Tabs defaultValue="questions">
      <TabsList className="w-full flex-wrap justify-start overflow-x-auto">
        <TabsTrigger value="design">Diseño</TabsTrigger>
        <TabsTrigger value="questions">
          Preguntas ({snapshot.questions.length})
        </TabsTrigger>
        <TabsTrigger value="logic">Lógica ({snapshot.rules.length})</TabsTrigger>
        <TabsTrigger value="results">
          Resultados ({snapshot.profiles.length})
        </TabsTrigger>
        <TabsTrigger value="leads">Leads</TabsTrigger>
        <TabsTrigger value="cta">CTA</TabsTrigger>
        <TabsTrigger value="settings">Ajustes</TabsTrigger>
        <TabsTrigger value="preview" className="xl:hidden">
          Preview
        </TabsTrigger>
      </TabsList>

      <TabsContent value="design" className="mt-4">
        <DesignTab
          funnelId={funnelId}
          intro={snapshot.intro}
          theme={snapshot.theme}
        />
      </TabsContent>
      <TabsContent value="questions" className="mt-4">
        <QuestionsTab funnelId={funnelId} questions={snapshot.questions} />
      </TabsContent>
      <TabsContent value="logic" className="mt-4">
        <LogicTab
          funnelId={funnelId}
          questions={snapshot.questions}
          profiles={snapshot.profiles}
          rules={snapshot.rules}
        />
      </TabsContent>
      <TabsContent value="results" className="mt-4">
        <ResultsTab funnelId={funnelId} profiles={snapshot.profiles} />
      </TabsContent>
      <TabsContent value="leads" className="mt-4">
        <LeadsTab funnelId={funnelId} leadCapture={snapshot.leadCapture} />
      </TabsContent>
      <TabsContent value="cta" className="mt-4">
        <CtaTab funnelId={funnelId} cta={snapshot.cta} />
      </TabsContent>
      <TabsContent value="preview" className="mt-4 xl:hidden">
        <div className="h-[70vh]">
          <PreviewPane snapshot={snapshot} />
        </div>
      </TabsContent>
      <TabsContent value="settings" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ajustes generales</CardTitle>
            <CardDescription>
              Nombre, URL pública y contexto del funnel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FunnelSettingsForm funnel={settings} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
