export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-vestige-cream">
      <div className="vestige-container py-10">{children}</div>
    </div>
  );
}
