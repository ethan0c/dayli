import { useLocalSearchParams } from 'expo-router';

import { CourseDetail } from '@/components/CourseDetail';

export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CourseDetail id={id} />;
}
