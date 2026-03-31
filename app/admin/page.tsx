import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/rbac';
import AdminDashboard from './admin-dashboard';

export default async function AdminPage() {
  const role = await getUserRole();

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/');
  }

  return <AdminDashboard />;
}
