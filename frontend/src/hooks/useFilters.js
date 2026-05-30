import { useMemo, useState } from "react";

const initialFilters = {
  dateRange: "all",
  provider: "all",
  status: "all",
  search: "",
};

function searchableText(result) {
  return [
    result.displayName,
    result.biomarker,
    result.rawTestName,
    result.panel,
    result.provider,
    result.category,
    result.subcategory,
    result.unit,
    result.sourceFile,
    result.rawReferenceRange,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function useFilters(labs, activeCategory) {
  const [filters, setFilters] = useState(initialFilters);

  const options = useMemo(() => {
    const providers = [...new Set(labs.map((result) => result.provider))].sort();
    const statuses = [...new Set(labs.map((result) => result.status))].sort();
    return { providers, statuses };
  }, [labs]);

  const filteredLabs = useMemo(() => {
    const now = new Date("2026-05-28T00:00:00");
    const months = filters.dateRange === "all" ? null : Number(filters.dateRange.replace("m", ""));
    const floor = months ? new Date(now.setMonth(now.getMonth() - months)) : null;
    const query = filters.search.trim().toLowerCase();
    const queryTerms = query.split(/\s+/).filter(Boolean);

    return labs.filter((result) => {
      const inCategory = query || activeCategory === "overview" || result.category === activeCategory;
      const inProvider = filters.provider === "all" || result.provider === filters.provider;
      const inStatus = filters.status === "all" || result.status === filters.status;
      const inDate = !floor || new Date(`${result.date}T00:00:00`) >= floor;
      const haystack = query ? searchableText(result) : "";
      const inSearch = !query || queryTerms.every((term) => haystack.includes(term));

      return inCategory && inProvider && inStatus && inDate && inSearch;
    });
  }, [activeCategory, filters, labs]);

  return { filters, setFilters, filteredLabs, options };
}
