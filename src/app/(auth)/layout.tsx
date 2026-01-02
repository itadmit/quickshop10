import { Providers } from '../providers';

export const metadata = {
  title: 'QuickShop - התחברות',
  description: 'התחבר לחשבון QuickShop שלך',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </Providers>
  );
}

