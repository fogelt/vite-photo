import { ClerkProvider } from '@clerk/clerk-react';
import { AdminGuard } from '@/components/auth';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * Clerk is only mounted inside the admin area. Keeping it out of the public
 * provider means anonymous visitors never load Clerk or receive its cookies.
 */
export default function AdminShell() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <AdminGuard />
    </ClerkProvider>
  );
}
