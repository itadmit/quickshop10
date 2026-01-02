import Link from 'next/link';

interface SplitBannerSectionProps {
  content: {
    items?: {
      title: string;
      imageUrl: string;
      link: string;
    }[];
  };
  settings: {
    height?: string;
  };
  basePath: string;
}

export function SplitBannerSection({ content, settings, basePath }: SplitBannerSectionProps) {
  const height = settings.height || '70vh';
  const items = content.items || [];

  return (
    <section className="grid md:grid-cols-2">
      {items.map((item, i) => (
        <Link 
          key={i}
          href={item.link.startsWith('/') ? `${basePath}${item.link}` : item.link}
          className="relative group overflow-hidden"
          style={{ height }}
        >
          <img 
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
          <div className="absolute inset-0 flex items-end justify-center pb-16">
            <span className="font-display text-3xl md:text-4xl text-white font-extralight tracking-[0.3em] uppercase">
              {item.title}
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}

