import { useEffect } from 'react';
import { useRouter } from 'next/router';
export default function LogsIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/logs/activity'); }, [router]);
  return null;
}
