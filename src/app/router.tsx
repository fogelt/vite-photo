import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { paths } from '@/config/paths';
import { AdminGuard } from '@/components/auth';
import {
  default as AppRoot,
  ErrorBoundary as AppRootErrorBoundary,
} from './routes/app/root';

const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};

export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: '/',
      element: <AppRoot />,
      //ErrorBoundary: AppRootErrorBoundary,
      children: [
        { index: true, lazy: () => import('./routes/app/portfolio').then(convert(queryClient)) },
        { path: paths.portraits.path, lazy: () => import('./routes/app/portraits').then(convert(queryClient)) },
        { path: paths.weddings.path, lazy: () => import('./routes/app/weddings').then(convert(queryClient)) },
        { path: paths.about.path, lazy: () => import('./routes/app/about').then(convert(queryClient)) },
        {
          path: 'admin',
          element: <AdminGuard />,
          children: [
            {
              index: true,
              lazy: () => import('./routes/auth/admin').then(convert(queryClient)),
            }
          ]
        },
      ],
    }
  ], {
    basename: '/vite-photo',
  });

export const AppRouter = () => {
  const queryClient = useQueryClient();
  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);
  return <RouterProvider router={router} />;
};