import { useMemo } from "react";
import { readingsFor } from "../utils/trendCalc";

export function useBiomarker(labs, biomarker) {
  return useMemo(() => readingsFor(labs, biomarker), [biomarker, labs]);
}
