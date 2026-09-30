import { cn } from "@/lib/utils";

interface DividerProps {
  className?: string;
  strong?: boolean;
  vertical?: boolean;
}

export function Divider({ className, strong, vertical }: DividerProps) {
  if (vertical) {
    return (
      <div
        className={cn(
          "w-px self-stretch",
          strong ? "bg-vestige-sand" : "bg-gradient-to-b from-transparent via-vestige-sand to-transparent",
          className
        )}
        aria-hidden
      />
    );
  }
  return (
    <hr
      className={cn(
        "border-0 h-px",
        strong ? "bg-vestige-sand" : "divider",
        className
      )}
      aria-hidden
    />
  );
}
