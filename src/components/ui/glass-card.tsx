import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  elevated?: boolean;
  noPad?: boolean;
}

export function GlassCard({ children, className, dark, elevated, noPad }: GlassCardProps) {
  return (
    <div
      className={cn(
        dark ? "glass-dark" : "glass",
        elevated && "shadow-elevated",
        !noPad && "p-6",
        "rounded",
        className
      )}
    >
      {children}
    </div>
  );
}
