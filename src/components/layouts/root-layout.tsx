import { Outlet } from 'react-router-dom';
import { Header, Footer } from '@/components/ui';

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto w-full px-8 py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}