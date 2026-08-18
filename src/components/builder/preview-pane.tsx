"use client";

import { useState } from "react";
import { Monitor, RotateCcw, Smartphone } from "lucide-react";

import { FunnelExperience } from "@/components/runner/funnel-experience";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FunnelSnapshot } from "@/lib/funnel-config";

export function PreviewPane({ snapshot }: { snapshot: FunnelSnapshot }) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Preview</p>
        <div className="flex items-center gap-1">
          <Button
            variant={device === "mobile" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setDevice("mobile")}
            title="Vista móvil"
          >
            <Smartphone className="size-4" />
          </Button>
          <Button
            variant={device === "desktop" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setDevice("desktop")}
            title="Vista escritorio"
          >
            <Monitor className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setResetKey((k) => k + 1)}
            title="Reiniciar preview"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-y-auto rounded-lg border bg-muted/40 p-4">
        <div
          className={cn(
            "overflow-hidden rounded-2xl border shadow-sm transition-all",
            device === "mobile" ? "w-[360px]" : "w-full max-w-2xl"
          )}
          style={{ minHeight: 560 }}
        >
          <FunnelExperience
            key={resetKey}
            snapshot={snapshot}
            businessName={snapshot.businessName}
            className="min-h-[560px]"
          />
        </div>
      </div>
    </div>
  );
}
