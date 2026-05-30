export default function ReferenceBar({ value, min, max }) {
  if (typeof value !== "number" || min == null || max == null) return null;

  const domainMin = min - (max - min) * 0.35;
  const domainMax = max + (max - min) * 0.35;
  const percent = Math.min(100, Math.max(0, ((value - domainMin) / (domainMax - domainMin)) * 100));
  const start = ((min - domainMin) / (domainMax - domainMin)) * 100;
  const width = ((max - min) / (domainMax - domainMin)) * 100;

  return (
    <div className="relative h-2 rounded-full bg-[#26344b]">
      <div
        className="absolute top-0 h-2 rounded-full bg-[rgba(93,246,186,0.68)] shadow-[0_0_16px_rgba(93,246,186,0.28)]"
        style={{ left: `${start}%`, width: `${width}%` }}
      />
      <div
        className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-primary shadow-glow"
        style={{ left: `${percent}%` }}
      />
    </div>
  );
}
