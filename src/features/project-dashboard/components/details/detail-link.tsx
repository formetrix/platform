export interface DetailLinkProps {
  onClick: () => void;
  children: React.ReactNode;
}

/** A cross-reference inside a detail panel (e.g. a dependency ticket ID) that opens another panel. */
export function DetailLink({ onClick, children }: DetailLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-primary focus-visible:ring-primary rounded font-mono text-sm font-medium underline-offset-4 transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:outline-none"
    >
      {children}
    </button>
  );
}
