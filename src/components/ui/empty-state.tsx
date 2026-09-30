import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface EmptyStateProps {
  title: string;
  body: string;
  action?: { label: string; href: string };
  className?: string;
}

export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-20 px-4", className)}>
      <div className="mx-auto mb-6 w-12 h-px bg-vestige-sand" />
      <h3 className="font-serif text-[1.5rem] text-vestige-ink mb-3">{title}</h3>
      <p className="t-body-sm text-vestige-bark max-w-xs mx-auto leading-relaxed">
        {body}
      </p>
      {action && (
        <Link href={action.href} className="btn-primary btn-sm mt-6 gap-1.5">
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
