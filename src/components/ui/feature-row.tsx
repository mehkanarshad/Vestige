import { cn } from "@/lib/utils";

interface FeatureRowItem {
  number?: string;
  title: string;
  body: string;
}

interface FeatureRowProps {
  items: FeatureRowItem[];
  columns?: 2 | 3 | 4;
  numbered?: boolean;
  className?: string;
}

export function FeatureRow({ items, columns = 3, numbered, className }: FeatureRowProps) {
  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid grid-cols-1 gap-8", colClass, className)}>
      {items.map((item, i) => (
        <div key={item.title} className="group">
          {numbered && (
            <span className="t-label-sm text-vestige-gold mb-3 block">
              {String(i + 1).padStart(2, "0")}
            </span>
          )}
          <div className="gold-line mb-4 transition-all duration-300 group-hover:w-12" />
          <h3 className="font-serif text-[1.2rem] text-vestige-ink mb-2 leading-snug">
            {item.title}
          </h3>
          <p className="t-body-sm text-vestige-bark leading-relaxed">
            {item.body}
          </p>
        </div>
      ))}
    </div>
  );
}
