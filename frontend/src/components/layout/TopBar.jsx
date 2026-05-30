import { Search, SlidersHorizontal } from "lucide-react";

export default function TopBar({ filters, setFilters, options }) {
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(17,21,28,0.78)] px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="font-display text-2xl font-bold">Lab Results Mission Control</div>
          <div className="text-sm text-secondary">Local-first lab dashboard with private data support.</div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-[130px_170px_150px_minmax(220px,300px)]">
          <label className="sr-only" htmlFor="dateRange">
            Date range
          </label>
          <select
            id="dateRange"
            className="control px-3 text-sm"
            value={filters.dateRange}
            onChange={(event) => update("dateRange", event.target.value)}
          >
            <option value="6m">6 months</option>
            <option value="12m">12 months</option>
            <option value="24m">24 months</option>
            <option value="all">All dates</option>
          </select>

          <label className="sr-only" htmlFor="provider">
            Provider
          </label>
          <select
            id="provider"
            className="control px-3 text-sm"
            value={filters.provider}
            onChange={(event) => update("provider", event.target.value)}
          >
            <option value="all">All providers</option>
            {options.providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            className="control px-3 text-sm"
            value={filters.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="all">All statuses</option>
            {options.statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <label className="relative col-span-2 md:col-span-1">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
            <input
              className="control w-full pl-9 pr-3 text-sm"
              placeholder="Search biomarkers"
              value={filters.search}
              onChange={(event) => update("search", event.target.value)}
            />
          </label>
        </div>
      </div>

      <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-secondary lg:hidden">
        <SlidersHorizontal size={18} />
      </button>
    </header>
  );
}
