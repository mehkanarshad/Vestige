import { Nav } from "./nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-[60px]">{children}</main>
    </>
  );
}
