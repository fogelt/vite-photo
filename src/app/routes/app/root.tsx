import { Outlet } from 'react-router-dom';
import { Header, Footer } from '@/components/ui';
import { ScrollToTop } from '@/utils';

export default function AppRoot() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-stone-100">
      <ScrollToTop />
      <Header />
      <main className="flex-grow min-h-[90vh]">
        <Outlet />
      </main>
      <div className="animate-in fade-in duration-1000 delay-700 fill-mode-both">
        <Footer />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <div className="p-10 text-center">Något gick fel. Försök ladda om sidan.</div>;
}