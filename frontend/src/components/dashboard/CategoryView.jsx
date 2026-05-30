import { AlertTriangle, CheckCircle2, Database, FlaskConical } from "lucide-react";

function Stat({ icon: Icon, label, value, tone = "text-primary" }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-secondary">{label}</span>
        <Icon className={tone} size={18} />
      </div>
      <div className="numeric mt-3 text-2xl font-medium">{value}</div>
    </div>
  );
}

export default function CategoryView({ labs }) {
  const total = labs.length;
  const flagged = labs.filter((result) => ["high", "low", "borderline-high", "borderline-low"].includes(result.status)).length;
  const providers = new Set(labs.map((result) => result.provider)).size;
  const nmr = labs.filter((result) => result.panel === "NMR LipoProfile").length;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={Database} label="Results in View" value={total} />
      <Stat icon={AlertTriangle} label="Flagged or Borderline" value={flagged} tone="text-[var(--status-borderline)]" />
      <Stat icon={CheckCircle2} label="Providers" value={providers} tone="text-[var(--status-normal)]" />
      <Stat icon={FlaskConical} label="NMR Markers" value={nmr} tone="text-accent" />
    </section>
  );
}
