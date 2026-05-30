import StatusDot from "../ui/StatusDot";
import { formatDate, formatValue } from "../../utils/formatters";

export default function UaStatusGrid({ labs }) {
  const uaLatest = labs
    .filter((result) => result.category === "Urinalysis")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  if (!uaLatest.length) return null;

  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold">Urinalysis Status Grid</h2>
        <p className="text-sm text-secondary">Mixed numeric and qualitative results rendered as status cells.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {uaLatest.map((result) => (
          <div key={result.id} className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">{result.displayName}</div>
                <div className="mt-1 text-xs text-secondary">{formatDate(result.date)}</div>
              </div>
              <StatusDot status={result.status} showLabel={false} />
            </div>
            <div className="numeric mt-4 text-2xl">{formatValue(result.value, 3)}</div>
            <div className="mt-2 text-xs text-secondary">{result.provider}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
