import { AppShell } from "@/components/layout/app-shell";
import { Footer } from "@/components/layout/footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="flex flex-col min-h-[calc(100vh-60px)]">
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </AppShell>
  );
}
