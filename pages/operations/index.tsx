import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function OperationsIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/operations/tender'); }, [router]);
  return null;
}
