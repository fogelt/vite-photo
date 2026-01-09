import { Outlet } from 'react-router-dom';
import { Header, Footer } from '@/components/ui';
import { ScrollToTop } from '@/utils';

export default function AppRoot() {
  return (
    <div className="min-h-screen flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <ScrollToTop /> {/* Place it here */}
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function ErrorBoundary() {
  return <div className="p-10 text-center">Något gick fel. Försök ladda om sidan.</div>;
}