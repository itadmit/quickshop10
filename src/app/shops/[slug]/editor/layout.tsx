// ============================================
// Editor Layout - Clean Full Screen (No Admin Chrome)
// ============================================

export const metadata = {
  title: 'עורך עיצוב | QuickShop',
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Override the admin layout with a clean full-screen experience
  return children;
}
