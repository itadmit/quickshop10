/**
 * Loyalty Progress Card
 * 
 * Server Component - מציג את מצב המועדון של הלקוח
 * מהירות: HTML מוכן מהשרת, אין JS בצד הלקוח
 */

import { Star, Gift, Truck, TrendingUp, User, Award, Crown, Gem, Flame, Sparkles, Medal, Trophy, Zap, Heart, Check, PartyPopper } from 'lucide-react';

// Icon mapping for tier icons
const TIER_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  medal: Medal,
  award: Award,
  trophy: Trophy,
  gem: Gem,
  crown: Crown,
  star: Star,
  sparkles: Sparkles,
  zap: Zap,
  flame: Flame,
};

// Helper to render tier icon
function TierIcon({ iconId, className = "w-5 h-5" }: { iconId: string | null; className?: string }) {
  const IconComponent = iconId ? TIER_ICON_MAP[iconId] : User;
  return IconComponent ? <IconComponent className={className} /> : <User className={className} />;
}

interface LoyaltyTier {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  level: number;
  discountPercentage: string;
  pointsMultiplier: string;
  freeShippingThreshold: string | null;
  benefitsList: string[];
}

interface LoyaltyProgressCardProps {
  currentTier: LoyaltyTier | null;
  nextTier: LoyaltyTier | null;
  currentPoints: number;
  pointsValue: number;
  progressPercentage: number;
  amountToNextTier: number;
  progressionType: 'total_spent' | 'total_orders' | 'points_earned';
  showProgressBar?: boolean;
}

export function LoyaltyProgressCard({
  currentTier,
  nextTier,
  currentPoints,
  pointsValue,
  progressPercentage,
  amountToNextTier,
  progressionType,
  showProgressBar = true,
}: LoyaltyProgressCardProps) {
  const progressLabel = {
    total_spent: `עוד ₪${amountToNextTier.toLocaleString('he-IL')}`,
    total_orders: `עוד ${amountToNextTier} הזמנות`,
    points_earned: `עוד ${amountToNextTier.toLocaleString('he-IL')} נקודות`,
  }[progressionType];
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header with Tier Badge */}
      <div 
        className="p-6"
        style={{ 
          background: `linear-gradient(135deg, ${currentTier?.color || '#6B7280'}15 0%, ${currentTier?.color || '#6B7280'}05 100%)`
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: currentTier?.color || '#6B7280',
                color: 'white' 
              }}
            >
              <TierIcon iconId={currentTier?.icon || 'user'} className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">הרמה שלך</p>
              <h3 className="text-xl font-bold text-gray-900">
                {currentTier?.name || 'חבר'}
              </h3>
            </div>
          </div>
          
          {/* Points Display */}
          <div className="text-left">
            <p className="text-2xl font-bold text-gray-900">
              {currentPoints.toLocaleString('he-IL')}
            </p>
            <p className="text-sm text-gray-500">נקודות</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        {showProgressBar && nextTier && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="flex items-center gap-1 text-gray-600">
                {progressLabel} לרמת {nextTier.name}
                <span 
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                  style={{ backgroundColor: nextTier.color, color: 'white' }}
                >
                  <TierIcon iconId={nextTier.icon} className="w-3 h-3" />
                </span>
              </span>
              <span className="font-medium text-gray-900">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progressPercentage}%`,
                  backgroundColor: nextTier.color 
                }}
              />
            </div>
          </div>
        )}
        
        {/* At max tier */}
        {showProgressBar && !nextTier && (
          <div className="mt-6 text-center">
            <p className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <PartyPopper className="w-4 h-4 text-amber-500" />
              הגעת לרמה הגבוהה ביותר!
            </p>
          </div>
        )}
      </div>
      
      {/* Points Value & Stats */}
      <div className="grid grid-cols-2 divide-x divide-x-reverse divide-gray-200 border-t border-gray-200">
        <div className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            ₪{pointsValue.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500">ערך הנקודות שלך</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            ×{currentTier?.pointsMultiplier || '1.0'}
          </p>
          <p className="text-xs text-gray-500">מכפיל נקודות</p>
        </div>
      </div>
      
      {/* Benefits */}
      {currentTier && (currentTier.benefitsList as string[]).length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">ההטבות שלך</h4>
          <ul className="space-y-2">
            {(currentTier.benefitsList as string[]).map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                {benefit}
              </li>
            ))}
            
            {/* Auto-generated benefits */}
            {Number(currentTier.discountPercentage) > 0 && (
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Gift className="w-4 h-4 text-purple-500" />
                {currentTier.discountPercentage}% הנחה על כל הזמנה
              </li>
            )}
            {currentTier.freeShippingThreshold && (
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="w-4 h-4 text-blue-500" />
                משלוח חינם מעל ₪{Number(currentTier.freeShippingThreshold).toLocaleString('he-IL')}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for header/sidebar
 */
export function LoyaltyBadgeCompact({
  currentTier,
  currentPoints,
}: {
  currentTier: LoyaltyTier | null;
  currentPoints: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ 
          backgroundColor: currentTier?.color || '#6B7280',
          color: 'white' 
        }}
      >
        <TierIcon iconId={currentTier?.icon || 'user'} className="w-3.5 h-3.5" />
      </div>
      <div className="text-sm">
        <span className="font-medium">{currentPoints.toLocaleString('he-IL')}</span>
        <span className="text-gray-500 mr-1">נקודות</span>
      </div>
    </div>
  );
}

