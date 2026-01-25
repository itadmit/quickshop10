/**
 * Loyalty Transactions List
 * 
 * Server Component - היסטוריית תנועות נקודות
 */

import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Plus, Minus, Gift, RotateCcw, Clock, Sparkles } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus' | 'refund';
  points: string;
  description: string | null;
  createdAt: Date;
}

interface LoyaltyTransactionsListProps {
  transactions: Transaction[];
}

const typeConfig = {
  earn: {
    icon: Plus,
    color: 'text-green-600',
    bg: 'bg-green-50',
    label: 'צבירה',
  },
  redeem: {
    icon: Minus,
    color: 'text-red-600',
    bg: 'bg-red-50',
    label: 'פדיון',
  },
  expire: {
    icon: Clock,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    label: 'פג תוקף',
  },
  adjust: {
    icon: RotateCcw,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    label: 'התאמה',
  },
  bonus: {
    icon: Sparkles,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    label: 'בונוס',
  },
  refund: {
    icon: RotateCcw,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    label: 'החזר',
  },
};

export function LoyaltyTransactionsList({ transactions }: LoyaltyTransactionsListProps) {
  if (!transactions.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>אין תנועות נקודות עדיין</p>
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-100">
      {transactions.map((tx) => {
        const config = typeConfig[tx.type];
        const Icon = config.icon;
        const points = Number(tx.points);
        const isPositive = points > 0;
        
        return (
          <div key={tx.id} className="flex items-center gap-4 py-3">
            {/* Icon */}
            <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            
            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {tx.description || config.label}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(tx.createdAt), { 
                  addSuffix: true,
                  locale: he 
                })}
              </p>
            </div>
            
            {/* Points */}
            <div className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{points.toLocaleString('he-IL')}
            </div>
          </div>
        );
      })}
    </div>
  );
}





