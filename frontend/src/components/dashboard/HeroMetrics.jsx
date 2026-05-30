import { heroBiomarkers } from "../../data/biomarkerMeta";
import BiomarkerCard from "./BiomarkerCard";

export default function HeroMetrics({ labs, selectedBiomarker, onSelectBiomarker }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Key Biomarkers</h2>
          <p className="text-sm text-secondary">Latest values from the current filtered dataset.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {heroBiomarkers.map((biomarker) => (
          <BiomarkerCard
            key={biomarker}
            biomarker={biomarker}
            labs={labs}
            active={selectedBiomarker === biomarker}
            onSelect={onSelectBiomarker}
          />
        ))}
      </div>
    </section>
  );
}
