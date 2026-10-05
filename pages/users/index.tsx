import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function UsersIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/users/administrator'); }, [router]);
  return null;
}
