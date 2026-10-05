import { useEffect } from 'react';
import { useRouter } from 'next/router';
export default function ConfigIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/config/general'); }, [router]);
  return null;
}
