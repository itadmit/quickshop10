import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://quickshop.co.il';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/checkout/',
          '/shops/*/admin/',
          '/shops/*/editor/',
          '/shops/*/checkout/',
          '/shops/*/thank-you/',
          '/shops/*/login/',
          '/shops/*/register/',
          '/shops/*/track/',
          '/shops/*/wishlist/',
          '/shops/*/influencer/',
          '/_next/',
          '/logout/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/checkout/',
          '/shops/*/admin/',
          '/shops/*/editor/',
          '/shops/*/checkout/',
          '/shops/*/thank-you/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
