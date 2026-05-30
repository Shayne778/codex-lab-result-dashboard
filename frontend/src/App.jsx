import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import PageWrapper from "./components/layout/PageWrapper";
import HeroMetrics from "./components/dashboard/HeroMetrics";
import TrendChart from "./components/dashboard/TrendChart";
import LabTable from "./components/dashboard/LabTable";
import UaStatusGrid from "./components/dashboard/UaStatusGrid";
import CategoryView from "./components/dashboard/CategoryView";
import { useLabs } from "./hooks/useLabs";
import { useFilters } from "./hooks/useFilters";

export default function App() {
  const labs = useLabs();
  const [activeCategory, setActiveCategory] = useState("overview");
  const [selectedBiomarker, setSelectedBiomarker] = useState("Glucose");
  const [overlay, setOverlay] = useState(false);
  const { filters, setFilters, filteredLabs, options } = useFilters(labs, activeCategory);

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <PageWrapper>
        <TopBar filters={filters} setFilters={setFilters} options={options} />
        <div className="space-y-5 px-4 py-5 sm:px-6 lg:px-8">
          <CategoryView labs={filteredLabs} />
          <HeroMetrics
            labs={filteredLabs}
            selectedBiomarker={selectedBiomarker}
            onSelectBiomarker={setSelectedBiomarker}
          />
          <TrendChart
            labs={filteredLabs}
            selectedBiomarker={selectedBiomarker}
            onSelectBiomarker={setSelectedBiomarker}
            overlay={overlay}
            onOverlayChange={setOverlay}
          />
          <UaStatusGrid labs={filteredLabs} />
          <LabTable labs={filteredLabs} />
        </div>
      </PageWrapper>
    </div>
  );
}
