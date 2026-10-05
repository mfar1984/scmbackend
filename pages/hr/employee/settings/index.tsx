import type { GetServerSideProps } from 'next';

export default function SettingsIndex() { return null; }

export const getServerSideProps: GetServerSideProps = async () => {
  return { redirect: { destination: '/hr/employee/settings/departments', permanent: false } };
};
