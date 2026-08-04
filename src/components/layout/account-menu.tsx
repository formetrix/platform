"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { SIGN_IN_PATH } from "@/lib/auth/routes";

/**
 * Header account controls.
 *
 * Client-side so the surrounding pages stay statically rendered — reading the
 * session on the server in the root layout would make every route dynamic. The
 * session state shown here is presentational only; the real gate is middleware
 * plus each page's verified server-side check.
 *
 * Renders nothing until the session resolves, rather than flashing "Sign in" at
 * a user who is already signed in.
 */
export function AccountMenu() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <span className="h-8 w-16" aria-hidden />;
  }

  if (!user) {
    return (
      <Link href={SIGN_IN_PATH} className={buttonVariants({ variant: "ghost", size: "sm" })}>
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-muted hidden max-w-[16ch] truncate text-xs sm:inline"
        title={user.email}
      >
        {user.email}
      </span>
      <SignOutButton />
    </div>
  );
}
