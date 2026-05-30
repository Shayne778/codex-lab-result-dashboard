import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartColors, statusColors } from "../../styles/theme";
import { trendBiomarkers } from "../../data/biomarkerMeta";
import { formatRange, formatShortDate, formatValue } from "../../utils/formatters";

const compareMap = {
  Glucose: ["Glucose", "HOMA-IR"],
  LDL: ["LDL", "LDL-P"],
  "LDL-P": ["LDL-P", "Small LDL-P", "LP-IR Score"],
  "Fasting Insulin": ["Fasting Insulin", "HOMA-IR", "LP-IR Score"],
  "Testosterone Total": ["Testosterone Total", "Testosterone Free"],
};

function makeChartRows(labs, selected, overlay) {
  const biomarkers = overlay ? compareMap[selected] ?? [selected] : [selected];
  const byDate = new Map();

  labs
    .filter((result) => biomarkers.includes(result.biomarker) && typeof result.value === "number")
    .forEach((result) => {
      if (!byDate.has(result.date)) byDate.set(result.date, { date: result.date });
      byDate.get(result.date)[result.biomarker] = result.value;
      byDate.get(result.date)[`${result.biomarker}Status`] = result.status;
      byDate.get(result.date)[`${result.biomarker}Provider`] = result.provider;
    });

  return {
    biomarkers,
    rows: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-[rgba(17,21,28,0.88)] p-3 text-xs shadow-2xl backdrop-blur-xl">
      <div className="mb-2 font-semibold text-primary">{formatShortDate(label)}</div>
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-5">
            <span style={{ color: item.color }}>{item.name}</span>
            <span className="numeric text-primary">{formatValue(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrendChart({ labs, selectedBiomarker, onSelectBiomarker, overlay, onOverlayChange }) {
  const { biomarkers, rows } = makeChartRows(labs, selectedBiomarker, overlay);
  const selectedLatest = labs.find((result) => result.biomarker === selectedBiomarker && typeof result.value === "number");

  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Trend Analysis</h2>
          <p className="mt-1 text-sm text-secondary">
            {selectedLatest
              ? `${selectedBiomarker} range: ${formatRange(
                  selectedLatest.referenceMin,
                  selectedLatest.referenceMax,
                  selectedLatest.unit
                )}`
              : "Select a biomarker to inspect its history."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`h-9 rounded-lg border px-3 text-sm ${
              overlay ? "border-accent/60 bg-accent/15 text-primary" : "border-white/10 text-secondary hover:bg-white/5"
            }`}
            onClick={() => onOverlayChange(!overlay)}
          >
            Overlay
          </button>
          {trendBiomarkers.map((biomarker) => (
            <button
              key={biomarker}
              className={`h-9 rounded-lg border px-3 text-sm transition ${
                selectedBiomarker === biomarker
                  ? "border-accent/60 bg-accent/15 text-primary"
                  : "border-white/10 text-secondary hover:bg-white/5 hover:text-primary"
              }`}
              onClick={() => onSelectBiomarker(biomarker)}
            >
              {biomarker}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 12, right: 24, bottom: 10, left: 0 }}>
            <CartesianGrid stroke="rgba(122,148,184,0.16)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatShortDate} stroke="var(--text-secondary)" tickLine={false} />
            <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={48} />
            {selectedLatest?.referenceMin != null && selectedLatest?.referenceMax != null && !overlay ? (
              <ReferenceArea
                y1={selectedLatest.referenceMin}
                y2={selectedLatest.referenceMax}
                fill="var(--status-normal)"
                fillOpacity={0.08}
              />
            ) : null}
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: 12 }} />
            {biomarkers.map((biomarker, index) => (
              <Line
                key={biomarker}
                type="monotone"
                dataKey={biomarker}
                name={biomarker}
                stroke={Object.values(chartColors)[index % Object.values(chartColors).length]}
                strokeWidth={2.5}
                connectNulls
                dot={({ cx, cy, payload, index }) => {
                  const status = payload[`${biomarker}Status`];
                  return (
                    <circle
                      key={`${biomarker}-${payload.date}-${index}`}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={statusColors[status] ?? "var(--accent-primary)"}
                      stroke="var(--bg-surface)"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
