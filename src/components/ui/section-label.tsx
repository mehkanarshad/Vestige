import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
}

export function SectionLabel({ children, className, gold }: SectionLabelProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className={cn("gold-line flex-shrink-0", gold ? "opacity-100" : "opacity-60")} />
      <span className="t-label-sm text-vestige-stone">{children}</span>
    </div>
  );
}
