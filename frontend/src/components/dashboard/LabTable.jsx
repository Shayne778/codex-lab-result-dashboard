import { useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import ProviderBadge from "./ProviderBadge";
import StatusDot from "../ui/StatusDot";
import { formatDate, formatRange, formatValue } from "../../utils/formatters";

const columns = [
  { key: "date", label: "Date" },
  { key: "displayName", label: "Biomarker" },
  { key: "value", label: "Value" },
  { key: "provider", label: "Provider" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
];

export default function LabTable({ labs }) {
  const [sort, setSort] = useState({ key: "date", direction: "desc" });

  const sorted = useMemo(() => {
    return [...labs].sort((a, b) => {
      const multiplier = sort.direction === "asc" ? 1 : -1;
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * multiplier;
      return String(av).localeCompare(String(bv)) * multiplier;
    });
  }, [labs, sort]);

  function updateSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  }

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-5">
        <div>
          <h2 className="font-display text-lg font-bold">All Results</h2>
          <p className="text-sm text-secondary">{labs.length} Excel-sourced results in view.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-white/[0.055] text-xs uppercase tracking-[0.08em] text-secondary">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3">
                  <button className="inline-flex items-center gap-2" onClick={() => updateSort(column.key)}>
                    {column.label}
                    <ArrowDownUp size={13} />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3">Range</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((result) => (
              <tr key={result.id} className="border-t border-white/10 hover:bg-white/[0.06]">
                <td className="whitespace-nowrap px-4 py-3 text-secondary">{formatDate(result.date)}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-primary">{result.displayName}</div>
                  <div className="text-xs text-muted">{result.panel}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="numeric text-base text-primary">{formatValue(result.value)}</span>
                  {result.unit ? <span className="ml-1 text-xs text-secondary">{result.unit}</span> : null}
                </td>
                <td className="px-4 py-3">
                  <ProviderBadge provider={result.provider} />
                </td>
                <td className="px-4 py-3 text-secondary">
                  {result.category}
                  <div className="text-xs text-muted">{result.subcategory}</div>
                </td>
                <td className="px-4 py-3 text-secondary">
                  <StatusDot status={result.status} />
                </td>
                <td className="px-4 py-3 text-secondary">
                  {formatRange(result.referenceMin, result.referenceMax, result.unit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
