'use client';

import { useParams } from 'next/navigation';
import { ExaminationDetail } from '@/features/examination/components/ExaminationDetail';

export default function ExaminationDetailPage() {
  const params = useParams<{ id: string }>();
  return <ExaminationDetail sessionId={params.id} />;
}
