import { Nav } from "./nav";

interface PublicShellProps {
  children: React.ReactNode;
  noTopPad?: boolean;
}

export function PublicShell({ children, noTopPad }: PublicShellProps) {
  return (
    <>
      <Nav />
      <main className={noTopPad ? "" : "pt-[60px]"}>{children}</main>
    </>
  );
}
