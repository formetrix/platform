export function FactRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="border-border flex flex-col gap-0.5 border-b py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-muted shrink-0 text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className={`text-sm break-words sm:text-right ${mono ? "font-metric" : ""}`}>{value}</dd>
    </div>
  );
}
