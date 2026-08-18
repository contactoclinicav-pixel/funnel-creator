import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  microLabel,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  microLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-wrap items-start justify-between gap-4", className)}
    >
      <div>
        {microLabel ? <p className="micro-label mb-2">{microLabel}</p> : null}
        <h1 className="display text-[30px] text-ink">{title}</h1>
        {description ? (
          <p className="mt-1 text-[15px] text-ink-primary">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

/** Tabs subrayadas del sistema: activa con borde inferior 2px petróleo. */
export function UnderlineTabs({
  items,
  activeKey,
}: {
  items: { key: string; label: string; href: string }[];
  activeKey: string;
}) {
  return (
    <div className="flex gap-6 border-b border-line">
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <a
            key={item.key}
            href={item.href}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-[14.5px] transition-colors transition-brand",
              active
                ? "border-brand font-semibold text-ink"
                : "border-transparent text-ink-secondary hover:text-ink"
            )}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
