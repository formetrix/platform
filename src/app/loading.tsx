import { Spinner } from "@/components/ui/spinner";

/**
 * Root-level loading fallback, shown while a route segment's data is
 * being fetched. Route segments can override this with their own
 * `loading.tsx` once they have a more specific skeleton to show.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner label="Loading page" />
    </div>
  );
}
