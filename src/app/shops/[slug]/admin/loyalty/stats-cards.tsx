/**
 * Loyalty Stats Cards
 * 
 * Server Component - No client-side JS needed
 */

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  subtitle?: string;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  green: 'bg-green-50 text-green-600 border-green-100',
  yellow: 'bg-amber-50 text-amber-600 border-amber-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
};

export function LoyaltyStatsCards({ cards }: { cards: StatsCardProps[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`rounded-xl border p-4 ${colorClasses[card.color]}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-80">{card.title}</span>
            {card.icon}
          </div>
          <p className="text-2xl font-bold">{card.value}</p>
          {card.subtitle && (
            <p className="text-xs opacity-60 mt-1">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}










