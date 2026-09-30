import { cn } from "@/lib/utils";

type TagVariant = "default" | "gold" | "muted" | "dark" | "outline";

interface TagProps {
  children: React.ReactNode;
  variant?: TagVariant;
  className?: string;
}

const variants: Record<TagVariant, string> = {
  default: "bg-vestige-sand text-vestige-umber border-transparent",
  gold:    "bg-vestige-gold/15 text-vestige-umber border-vestige-gold/30",
  muted:   "bg-vestige-parchment text-vestige-stone border-transparent",
  dark:    "bg-vestige-espresso text-vestige-cream border-transparent",
  outline: "bg-transparent text-vestige-bark border-vestige-sand",
};

export function Tag({ children, variant = "default", className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border t-label-sm font-normal normal-case tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
