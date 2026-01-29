// ============================================
// Editor Layout - Full Screen (No Admin Layout)
// ============================================

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout overrides the admin layout for full-screen editor
  return (
    <div className="fixed inset-0 z-[100]">
      {children}
    </div>
  );
}










