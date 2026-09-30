import { cn } from "@/lib/utils";
import { SectionLabel } from "./section-label";

interface PageHeroProps {
  label?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  centered?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

const sizeMap = {
  sm: "py-16 sm:py-20",
  md: "py-20 sm:py-28",
  lg: "py-24 sm:py-36",
};

export function PageHero({
  label,
  title,
  subtitle,
  actions,
  centered = false,
  size = "md",
  className,
  children,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        sizeMap[size],
        className
      )}
    >
      <div className={cn("container-lg", centered && "text-center")}>
        {label && (
          <div className={cn("mb-6", centered && "flex justify-center")}>
            <SectionLabel>{label}</SectionLabel>
          </div>
        )}

        <h1
          className={cn(
            "t-display-xl text-balance",
            centered ? "mx-auto max-w-3xl" : "max-w-2xl"
          )}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className={cn(
              "mt-5 t-body-lg text-balance",
              centered ? "mx-auto max-w-xl" : "max-w-lg"
            )}
          >
            {subtitle}
          </p>
        )}

        {actions && (
          <div
            className={cn(
              "mt-8 flex flex-wrap gap-3",
              centered && "justify-center"
            )}
          >
            {actions}
          </div>
        )}

        {children}
      </div>
    </section>
  );
}
