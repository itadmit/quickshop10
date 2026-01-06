import { redirect } from 'next/navigation';

interface ScratchCardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ScratchCardPage({ params }: ScratchCardPageProps) {
  const { slug } = await params;
  redirect(`/shops/${slug}/admin/plugins/gamification?type=scratch`);
}

