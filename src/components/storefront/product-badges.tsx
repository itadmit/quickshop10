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

// מיקומים מותאמים לסגנון המדבקות האוטומטיות
const positionClasses: Record<string, string> = {
  'top-right': 'absolute top-4 right-4',
  'top-left': 'absolute top-4 left-4', 
  'bottom-right': 'absolute bottom-4 right-4',
  'bottom-left': 'absolute bottom-4 left-4',
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
          className={`${positionClasses[position] || positionClasses['top-right']} flex flex-col gap-2 z-10`}
        >
          {positionBadges.map(badge => (
            <span
              key={badge.id}
              className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 font-medium whitespace-nowrap"
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
