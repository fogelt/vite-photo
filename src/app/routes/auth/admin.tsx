import { AdminLayout } from "@/components/layouts/auth/admin-layout";
import { useSEO } from "@/utils";

export default function AdminRoute() {
  useSEO({
    title: 'Admin | Myelie Lendelund',
    description: 'Administration för myeliefoto.se.',
    canonical: 'https://myeliefoto.se/admin',
    noindex: true,
  });

  return <AdminLayout />;
}