import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-border border-t">
      <div className="text-muted mx-auto max-w-6xl px-4 py-6 text-sm">
        © {new Date().getFullYear()} {siteConfig.name}
      </div>
    </footer>
  );
}
