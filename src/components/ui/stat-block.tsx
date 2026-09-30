import { cn } from "@/lib/utils";

interface StatItem {
  value: string | number;
  label: string;
  sub?: string;
}

interface StatBlockProps {
  stats: StatItem[];
  className?: string;
}

export function StatBlock({ stats, className }: StatBlockProps) {
  return (
    <div className={cn("grid grid-cols-2 sm:flex sm:items-start gap-8 sm:gap-12", className)}>
      {stats.map((stat) => (
        <div key={stat.label}>
          <p className="font-serif text-[2.25rem] leading-none tracking-tight text-vestige-ink">
            {stat.value}
          </p>
          <p className="t-label mt-2 text-vestige-stone">{stat.label}</p>
          {stat.sub && (
            <p className="t-body-sm text-vestige-stone mt-0.5">{stat.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
