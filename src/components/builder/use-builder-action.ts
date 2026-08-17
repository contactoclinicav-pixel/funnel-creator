"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ActionResult = { success?: boolean; error?: string } | undefined;

/** Ejecuta una server action del builder con toast de error y refresh. */
export function useBuilderAction() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run(
    promise: Promise<ActionResult>,
    successMessage?: string
  ): Promise<boolean> {
    setPending(true);
    const result = await promise;
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return false;
    }
    if (successMessage) {
      toast.success(successMessage);
    }
    router.refresh();
    return true;
  }

  return { run, pending };
}
