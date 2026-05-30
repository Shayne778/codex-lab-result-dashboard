import { Activity, FlaskConical, Settings, Upload } from "lucide-react";
import { categoryTree } from "../../data/biomarkerMeta";

export default function Sidebar({ activeCategory, onCategoryChange }) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[240px] flex-col border-r border-white/10 bg-[rgba(17,21,28,0.9)] px-5 py-6 backdrop-blur-xl lg:flex">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg border border-accent/30 bg-accent/15 text-accent">
          <Activity size={21} />
        </div>
        <div>
          <div className="font-display text-lg font-bold">LabVault</div>
          <div className="text-xs text-secondary">Clinical dashboard</div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {categoryTree.map((item) => (
          <div key={item.id} className="pb-2">
            <button
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                activeCategory === item.id ? "bg-elevated text-primary" : "text-secondary hover:bg-white/5 hover:text-primary"
              }`}
              onClick={() => onCategoryChange(item.id)}
            >
              <span>{item.label}</span>
              {item.id === "Lipids" ? <FlaskConical size={15} /> : null}
            </button>
            {item.children.length ? (
              <div className="mt-1 space-y-1 border-l border-white/10 pl-4">
                {item.children.map((child) => (
                  <div key={child} className="px-2 py-1 text-xs text-muted">
                    {child}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/10 pt-4">
        <button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-white shadow-glow">
          <Upload size={16} />
          Upload Labs
        </button>
        <button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-sm text-secondary hover:bg-white/5 hover:text-primary">
          <Settings size={16} />
          Settings
        </button>
      </div>
    </aside>
  );
}
