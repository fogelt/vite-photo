import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 1. Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Keep photo data "fresh" for 5 minutes
    },
  },
});

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <React.Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-gray-400">Laddar…</span>
          </div>
        }
      >
        {children}
      </React.Suspense>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};