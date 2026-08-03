import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-border border-t">
      <div className="text-muted mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm">
        <span>
          © {new Date().getFullYear()} {siteConfig.name}
        </span>
        <Link
          href="/internal/project-dashboard"
          className="hover:text-foreground underline-offset-4 hover:underline"
        >
          Project Dashboard <span className="text-xs">(internal)</span>
        </Link>
      </div>
    </footer>
  );
}
