"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Plus, Trash2 } from "lucide-react";

import {
  addRuleAction,
  deleteRuleAction,
} from "@/app/(app)/funnels/[funnelId]/edit/actions";
import { useBuilderAction } from "@/components/builder/use-builder-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SnapshotProfile,
  SnapshotQuestion,
  SnapshotRule,
} from "@/lib/funnel-config";

export function LogicTab({
  funnelId,
  questions,
  profiles,
  rules,
}: {
  funnelId: string;
  questions: SnapshotQuestion[];
  profiles: SnapshotProfile[];
  rules: SnapshotRule[];
}) {
  const choiceQuestions = questions.filter((q) => q.options.length > 0);
  const questionById = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions]
  );
  const profileById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles]
  );

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reglas actuales</CardTitle>
          <CardDescription>
            Puntúan perfiles o saltan preguntas según la respuesta elegida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Sin reglas todavía. Sin reglas de puntos, el resultado será el
              primer perfil de la lista.
            </p>
          ) : (
            <ul className="grid gap-2">
              {rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  funnelId={funnelId}
                  rule={rule}
                  questionById={questionById}
                  profileById={profileById}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {choiceQuestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Añade preguntas de selección (única, múltiple o sí/no) para poder
          crear reglas.
        </p>
      ) : (
        <AddRuleForm
          funnelId={funnelId}
          choiceQuestions={choiceQuestions}
          allQuestions={questions}
          profiles={profiles}
        />
      )}
    </div>
  );
}

function RuleRow({
  funnelId,
  rule,
  questionById,
  profileById,
}: {
  funnelId: string;
  rule: SnapshotRule;
  questionById: Map<string, SnapshotQuestion>;
  profileById: Map<string, SnapshotProfile>;
}) {
  const { run, pending } = useBuilderAction();
  const question = questionById.get(rule.questionId);
  const option = question?.options.find((o) => o.id === rule.optionId);

  const consequence =
    rule.action === "ADD_SCORE"
      ? `${(rule.points ?? 0) >= 0 ? "+" : ""}${rule.points ?? 0} pts a «${
          profileById.get(rule.targetProfileId ?? "")?.title ?? "?"
        }»`
      : `ir a «${questionById.get(rule.targetQuestionId ?? "")?.title ?? "?"}»`;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground">SI</span>
        <span className="max-w-48 truncate font-medium">
          {question?.title ?? "?"}
        </span>
        <span className="text-muted-foreground">=</span>
        <span className="max-w-36 truncate font-medium">
          {option?.label ?? "?"}
        </span>
        <ArrowRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium">{consequence}</span>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        title="Eliminar regla"
        onClick={() => run(deleteRuleAction({ funnelId, ruleId: rule.id }))}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </li>
  );
}

function AddRuleForm({
  funnelId,
  choiceQuestions,
  allQuestions,
  profiles,
}: {
  funnelId: string;
  choiceQuestions: SnapshotQuestion[];
  allQuestions: SnapshotQuestion[];
  profiles: SnapshotProfile[];
}) {
  const { run, pending } = useBuilderAction();
  const [questionId, setQuestionId] = useState("");
  const [optionId, setOptionId] = useState("");
  const [action, setAction] = useState<"ADD_SCORE" | "GOTO_QUESTION">("ADD_SCORE");
  const [targetProfileId, setTargetProfileId] = useState("");
  const [points, setPoints] = useState("1");
  const [targetQuestionId, setTargetQuestionId] = useState("");

  const selectedQuestion = choiceQuestions.find((q) => q.id === questionId);
  const laterQuestions = allQuestions.filter(
    (q) => selectedQuestion && q.order > selectedQuestion.order
  );

  const canSubmit =
    questionId &&
    optionId &&
    (action === "ADD_SCORE"
      ? targetProfileId && points !== ""
      : targetQuestionId);

  async function submit() {
    const payload =
      action === "ADD_SCORE"
        ? {
            action: "ADD_SCORE" as const,
            funnelId,
            questionId,
            optionId,
            targetProfileId,
            points: Number(points),
          }
        : {
            action: "GOTO_QUESTION" as const,
            funnelId,
            questionId,
            optionId,
            targetQuestionId,
          };
    const ok = await run(addRuleAction(payload), "Regla añadida.");
    if (ok) {
      setOptionId("");
      setTargetProfileId("");
      setTargetQuestionId("");
      setPoints("1");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nueva regla</CardTitle>
        <CardDescription>
          SI la respuesta es X → sumar puntos a un perfil o saltar a otra
          pregunta.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Pregunta</Label>
            <Select
              value={questionId}
              onValueChange={(v) => {
                setQuestionId(v);
                setOptionId("");
                setTargetQuestionId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elige una pregunta" />
              </SelectTrigger>
              <SelectContent>
                {choiceQuestions.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.order}. {q.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Respuesta</Label>
            <Select
              value={optionId}
              onValueChange={setOptionId}
              disabled={!selectedQuestion}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elige una opción" />
              </SelectTrigger>
              <SelectContent>
                {selectedQuestion?.options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label>Acción</Label>
          <Select
            value={action}
            onValueChange={(v) => setAction(v as typeof action)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADD_SCORE">Sumar puntos a un perfil</SelectItem>
              <SelectItem value="GOTO_QUESTION">Saltar a otra pregunta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {action === "ADD_SCORE" ? (
          profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Crea al menos un perfil en la pestaña Resultados para poder
              puntuar.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Perfil</Label>
                <Select value={targetProfileId} onValueChange={setTargetProfileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Puntos</Label>
                <Input
                  type="number"
                  min={-100}
                  max={100}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </div>
            </div>
          )
        ) : laterQuestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Solo se puede saltar hacia preguntas posteriores. Elige una pregunta
            que no sea la última.
          </p>
        ) : (
          <div className="grid gap-1.5">
            <Label>Ir a la pregunta</Label>
            <Select value={targetQuestionId} onValueChange={setTargetQuestionId}>
              <SelectTrigger>
                <SelectValue placeholder="Elige el destino" />
              </SelectTrigger>
              <SelectContent>
                {laterQuestions.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.order}. {q.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Button disabled={!canSubmit || pending} onClick={submit}>
            <Plus className="size-4" />
            {pending ? "Añadiendo…" : "Añadir regla"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
