import Link from 'next/link';

interface VideoBannerSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    videoUrl?: string;
    imageUrl?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  settings: {
    height?: string;
    overlay?: number;
  };
  basePath: string;
}

export function VideoBannerSection({ title, subtitle, content, settings, basePath }: VideoBannerSectionProps) {
  const height = settings.height || '80vh';
  const overlay = settings.overlay ?? 0.2;

  return (
    <section className="relative overflow-hidden bg-black" style={{ height }}>
      {content.videoUrl ? (
        <video 
          src={content.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      ) : content.imageUrl ? (
        <img 
          src={content.imageUrl}
          alt={title || 'Banner'}
          className="w-full h-full object-cover"
        />
      ) : null}
      
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
      >
        <div className="text-center max-w-2xl px-6">
          {subtitle && (
            <p className="text-white/80 text-xs tracking-[0.4em] uppercase mb-6">{subtitle}</p>
          )}
          {title && (
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-extralight tracking-[0.2em] uppercase mb-8">
              {title}
            </h2>
          )}
          {content.buttonText && content.buttonLink && (
            <Link 
              href={content.buttonLink.startsWith('/') ? `${basePath}${content.buttonLink}` : content.buttonLink}
              className="btn-secondary !border-white !text-white hover:!bg-white hover:!text-black"
            >
              {content.buttonText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

