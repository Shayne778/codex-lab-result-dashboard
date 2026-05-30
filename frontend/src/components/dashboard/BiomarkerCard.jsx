import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import ReferenceBar from "./ReferenceBar";
import StatusDot from "../ui/StatusDot";
import TrendArrow from "../ui/TrendArrow";
import { formatDate, formatValue } from "../../utils/formatters";
import { readingsFor, trendFor } from "../../utils/trendCalc";

export default function BiomarkerCard({ biomarker, labs, active, onSelect }) {
  const readings = readingsFor(labs, biomarker);
  const latest = readings.at(-1);
  const trend = trendFor(labs, biomarker);
  const spark = readings.slice(-6).map((result) => ({ date: result.date, value: result.value }));

  if (!latest) return null;

  return (
    <button
      className={`panel grid min-h-[172px] w-full grid-rows-[auto_1fr_auto] p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/45 ${
        active ? "border-accent/70 shadow-glow" : ""
      }`}
      onClick={() => onSelect(biomarker)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">{latest.displayName}</div>
          <div className="mt-1 flex items-end gap-2">
            <span className="numeric text-3xl font-medium leading-none">{formatValue(latest.value)}</span>
            <span className="pb-0.5 text-xs text-secondary">{latest.unit}</span>
          </div>
        </div>
        <TrendArrow trend={trend} />
      </div>

      <div className="mt-3 grid grid-cols-[1fr_104px] items-center gap-3">
        <div className="space-y-3">
          <div className="text-xs text-secondary">
            <StatusDot status={latest.status} />
          </div>
          <ReferenceBar value={latest.value} min={latest.referenceMin} max={latest.referenceMax} />
        </div>
        <div className="h-14">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spark} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
              <Tooltip content={() => null} cursor={false} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--accent-primary)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-secondary">
        <span>{formatDate(latest.date)}</span>
        <span>{latest.provider}</span>
      </div>
    </button>
  );
}
