"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  addOptionAction,
  addQuestionAction,
  deleteOptionAction,
  deleteQuestionAction,
  duplicateQuestionAction,
  moveQuestionAction,
  updateOptionAction,
  updateQuestionAction,
} from "@/app/(app)/funnels/[funnelId]/edit/actions";
import { useBuilderAction } from "@/components/builder/use-builder-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  QUESTION_TYPE_LABELS,
  type QuestionTypeValue,
  type SnapshotQuestion,
} from "@/lib/funnel-config";

const CHOICE_TYPES: QuestionTypeValue[] = [
  "SINGLE_CHOICE",
  "MULTI_CHOICE",
  "YES_NO",
];
const TEXTUAL_TYPES: QuestionTypeValue[] = ["TEXT", "NUMBER", "EMAIL", "PHONE"];

export function QuestionsTab({
  funnelId,
  questions,
}: {
  funnelId: string;
  questions: SnapshotQuestion[];
}) {
  const { run, pending } = useBuilderAction();

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {questions.length === 0
            ? "Añade la primera pregunta de tu funnel."
            : `${questions.length} pregunta${questions.length === 1 ? "" : "s"} — una por pantalla.`}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={pending}>
              <Plus className="size-4" />
              Añadir pregunta
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {(Object.keys(QUESTION_TYPE_LABELS) as QuestionTypeValue[]).map(
              (type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() =>
                    run(addQuestionAction({ funnelId, type }), "Pregunta añadida.")
                  }
                >
                  {QUESTION_TYPE_LABELS[type]}
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          funnelId={funnelId}
          question={question}
          index={index}
          total={questions.length}
        />
      ))}
    </div>
  );
}

function QuestionCard({
  funnelId,
  question,
  index,
  total,
}: {
  funnelId: string;
  question: SnapshotQuestion;
  index: number;
  total: number;
}) {
  const { run, pending } = useBuilderAction();
  const [required, setRequired] = useState(question.required);

  const isChoice = CHOICE_TYPES.includes(question.type);
  const isTextual = TEXTUAL_TYPES.includes(question.type);
  const settings = question.settings ?? {};

  async function saveQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Parameters<typeof updateQuestionAction>[0] = {
      funnelId,
      questionId: question.id,
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      required,
    };
    if (question.type === "SCALE") {
      payload.settings = {
        scaleMin: 1,
        scaleMax: Number(form.get("scaleMax") ?? 5),
        scaleMinLabel: String(form.get("scaleMinLabel") ?? ""),
        scaleMaxLabel: String(form.get("scaleMaxLabel") ?? ""),
      };
    } else if (isTextual) {
      payload.settings = {
        placeholder: String(form.get("placeholder") ?? ""),
      };
    }
    await run(updateQuestionAction(payload), "Pregunta guardada.");
  }

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex-row items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {index + 1}
          </span>
          <Badge variant="secondary">
            {QUESTION_TYPE_LABELS[question.type]}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending || index === 0}
            title="Subir"
            onClick={() =>
              run(
                moveQuestionAction({
                  funnelId,
                  questionId: question.id,
                  direction: "up",
                })
              )
            }
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending || index === total - 1}
            title="Bajar"
            onClick={() =>
              run(
                moveQuestionAction({
                  funnelId,
                  questionId: question.id,
                  direction: "down",
                })
              )
            }
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            title="Duplicar"
            onClick={() =>
              run(
                duplicateQuestionAction({ funnelId, questionId: question.id }),
                "Pregunta duplicada."
              )
            }
          >
            <Copy className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            title="Eliminar"
            onClick={() =>
              run(
                deleteQuestionAction({ funnelId, questionId: question.id }),
                "Pregunta eliminada."
              )
            }
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <form onSubmit={saveQuestion} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`q-title-${question.id}`}>Pregunta</Label>
            <Input
              id={`q-title-${question.id}`}
              name="title"
              defaultValue={question.title}
              maxLength={200}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`q-desc-${question.id}`}>
              Descripción <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id={`q-desc-${question.id}`}
              name="description"
              defaultValue={question.description ?? ""}
              maxLength={300}
            />
          </div>

          {question.type === "SCALE" ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>Escala hasta</Label>
                <Select name="scaleMax" defaultValue={String(settings.scaleMax ?? 5)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 7, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        1 – {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`q-minlabel-${question.id}`}>Etiqueta mín.</Label>
                <Input
                  id={`q-minlabel-${question.id}`}
                  name="scaleMinLabel"
                  defaultValue={settings.scaleMinLabel ?? ""}
                  placeholder="Nada"
                  maxLength={40}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`q-maxlabel-${question.id}`}>Etiqueta máx.</Label>
                <Input
                  id={`q-maxlabel-${question.id}`}
                  name="scaleMaxLabel"
                  defaultValue={settings.scaleMaxLabel ?? ""}
                  placeholder="Mucho"
                  maxLength={40}
                />
              </div>
            </div>
          ) : null}

          {isTextual ? (
            <div className="grid gap-1.5">
              <Label htmlFor={`q-placeholder-${question.id}`}>
                Placeholder <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id={`q-placeholder-${question.id}`}
                name="placeholder"
                defaultValue={settings.placeholder ?? ""}
                maxLength={80}
              />
            </div>
          ) : null}

          {isChoice ? (
            <OptionsEditor funnelId={funnelId} question={question} />
          ) : null}

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={required} onCheckedChange={setRequired} />
              Obligatoria
            </label>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function OptionsEditor({
  funnelId,
  question,
}: {
  funnelId: string;
  question: SnapshotQuestion;
}) {
  const { run, pending } = useBuilderAction();
  const options = [...question.options].sort((a, b) => a.order - b.order);

  return (
    <div className="grid gap-1.5">
      <Label>Opciones</Label>
      <div className="grid gap-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-2">
            <Input
              defaultValue={option.label}
              maxLength={120}
              onBlur={(e) => {
                const label = e.target.value.trim();
                if (label && label !== option.label) {
                  run(
                    updateOptionAction({
                      funnelId,
                      questionId: question.id,
                      optionId: option.id,
                      label,
                    })
                  );
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pending || options.length <= 1}
              title="Eliminar opción"
              onClick={() =>
                run(
                  deleteOptionAction({
                    funnelId,
                    questionId: question.id,
                    optionId: option.id,
                  })
                )
              }
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      {question.type !== "YES_NO" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1 w-fit"
          disabled={pending}
          onClick={() =>
            run(addOptionAction({ funnelId, questionId: question.id }))
          }
        >
          <Plus className="size-4" />
          Añadir opción
        </Button>
      ) : null}
    </div>
  );
}
