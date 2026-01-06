import { redirect } from 'next/navigation';

interface WheelOfFortunePageProps {
  params: Promise<{ slug: string }>;
}

export default async function WheelOfFortunePage({ params }: WheelOfFortunePageProps) {
  const { slug } = await params;
  redirect(`/shops/${slug}/admin/plugins/gamification?type=wheel`);
}

