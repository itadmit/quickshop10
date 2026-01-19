// 🚀 Server Component - אין JS בצד לקוח!
// מהיר כמו PHP - HTML מהשרת ישירות

interface Badge {
  id: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  position: string;
}

interface ProductBadgesProps {
  badges: Badge[];
}

const positionClasses: Record<string, string> = {
  'top-right': 'absolute top-2 right-2',
  'top-left': 'absolute top-2 left-2', 
  'bottom-right': 'absolute bottom-2 right-2',
  'bottom-left': 'absolute bottom-2 left-2',
};

export function ProductBadges({ badges }: ProductBadgesProps) {
  if (!badges || badges.length === 0) return null;
  
  // קיבוץ לפי מיקום
  const byPosition = badges.reduce((acc, badge) => {
    const pos = badge.position || 'top-right';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);
  
  return (
    <>
      {Object.entries(byPosition).map(([position, positionBadges]) => (
        <div 
          key={position}
          className={`${positionClasses[position] || positionClasses['top-right']} flex flex-col gap-1 z-10`}
        >
          {positionBadges.map(badge => (
            <span
              key={badge.id}
              className="px-2 py-0.5 text-xs font-medium whitespace-nowrap"
              style={{ 
                backgroundColor: badge.backgroundColor,
                color: badge.textColor,
              }}
            >
              {badge.text}
            </span>
          ))}
        </div>
      ))}
    </>
  );
}

