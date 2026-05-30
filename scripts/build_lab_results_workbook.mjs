import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "outputs", "lab_results_inventory");
const dataPath = path.join(outputDir, "all_lab_results.json");
const summaryPath = path.join(outputDir, "file_summary.json");
const workbookPath = path.join(outputDir, "Lab Results Inventory.xlsx");

const rows = JSON.parse(await fs.readFile(dataPath, "utf8"));
const fileSummary = JSON.parse(await fs.readFile(summaryPath, "utf8"));

const workbook = Workbook.create();
const summarySheet = workbook.worksheets.add("Summary");
const resultsSheet = workbook.worksheets.add("All Results");
const filesSheet = workbook.worksheets.add("Files Reviewed");
const notesSheet = workbook.worksheets.add("Extraction Notes");

function asExcelDate(isoDate) {
  return isoDate ? new Date(`${isoDate}T00:00:00`) : null;
}

function setHeader(range) {
  range.format = {
    fill: "#1F4E78",
    font: { bold: true, color: "#FFFFFF" },
    wrapText: true,
  };
}

function setWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 1, 1).format.columnWidthPx = width;
  });
}

const resultHeaders = [
  "Source File",
  "Page",
  "Provider",
  "Collection Date",
  "Panel / Section",
  "Test Name",
  "Result Value Raw",
  "Numeric Value",
  "Comparator",
  "Reported Flag",
  "Unit",
  "Reference Range Raw",
  "Reference Min",
  "Reference Max",
  "Inferred Status",
  "Extraction Note",
];

const resultValues = rows.map((row) => [
  row.source_file,
  row.page,
  row.provider,
  asExcelDate(row.collection_date),
  row.panel_or_section,
  row.test_name,
  row.result_value_raw,
  row.result_value_numeric,
  row.comparator,
  row.flag_reported,
  row.unit,
  row.reference_range_raw,
  row.reference_min,
  row.reference_max,
  row.status_inferred,
  row.extraction_note,
]);

resultsSheet.getRangeByIndexes(0, 0, 1, resultHeaders.length).values = [resultHeaders];
resultsSheet.getRangeByIndexes(1, 0, resultValues.length, resultHeaders.length).values = resultValues;
setHeader(resultsSheet.getRangeByIndexes(0, 0, 1, resultHeaders.length));
resultsSheet.freezePanes.freezeRows(1);
resultsSheet.getRange(`D2:D${resultValues.length + 1}`).setNumberFormat("yyyy-mm-dd");
resultsSheet.getRange(`H2:H${resultValues.length + 1}`).setNumberFormat("0.00");
resultsSheet.getRange(`M2:N${resultValues.length + 1}`).setNumberFormat("0.00");
setWidths(resultsSheet, [260, 50, 130, 110, 220, 240, 130, 105, 80, 95, 120, 240, 105, 105, 110, 190]);
const resultsTable = resultsSheet.tables.add(`A1:P${resultValues.length + 1}`, true, "AllLabResults");
resultsTable.style = "TableStyleMedium2";

const fileHeaders = ["Source File", "Provider", "Collection Date", "Pages", "Text Characters", "Results Extracted"];
const fileValues = fileSummary.map((file) => [
  file.source_file,
  file.provider,
  asExcelDate(file.collection_date),
  file.pages,
  file.text_characters,
  file.results_extracted,
]);
filesSheet.getRangeByIndexes(0, 0, 1, fileHeaders.length).values = [fileHeaders];
filesSheet.getRangeByIndexes(1, 0, fileValues.length, fileHeaders.length).values = fileValues;
setHeader(filesSheet.getRangeByIndexes(0, 0, 1, fileHeaders.length));
filesSheet.freezePanes.freezeRows(1);
filesSheet.getRange(`C2:C${fileValues.length + 1}`).setNumberFormat("yyyy-mm-dd");
filesSheet.getRange(`D2:F${fileValues.length + 1}`).setNumberFormat("0");
setWidths(filesSheet, [360, 140, 120, 70, 120, 120]);
const fileTable = filesSheet.tables.add(`A1:F${fileValues.length + 1}`, true, "FilesReviewed");
fileTable.style = "TableStyleMedium4";

const providerCounts = [...rows.reduce((map, row) => {
  map.set(row.provider, (map.get(row.provider) || 0) + 1);
  return map;
}, new Map()).entries()].sort((a, b) => a[0].localeCompare(b[0]));
const statusCounts = [...rows.reduce((map, row) => {
  const key = row.status_inferred || "Unclassified";
  map.set(key, (map.get(key) || 0) + 1);
  return map;
}, new Map()).entries()].sort((a, b) => b[1] - a[1]);
const dates = rows.map((row) => row.collection_date).filter(Boolean).sort();

summarySheet.getRange("A1:F1").merge();
summarySheet.getRange("A1").values = [["Lab Results PDF Inventory"]];
summarySheet.getRange("A1").format = {
  fill: "#17365D",
  font: { bold: true, color: "#FFFFFF", size: 16 },
};

summarySheet.getRange("A3:B8").values = [
  ["Total extracted result rows", rows.length],
  ["PDF files reviewed", fileSummary.length],
  ["Providers detected", providerCounts.length],
  ["Earliest collection date", asExcelDate(dates[0])],
  ["Latest collection date", asExcelDate(dates.at(-1))],
  ["Workbook generated", new Date()],
];
summarySheet.getRange("A3:A8").format = { font: { bold: true }, fill: "#D9EAF7" };
summarySheet.getRange("B6:B8").setNumberFormat("yyyy-mm-dd");
summarySheet.getRange("B8").setNumberFormat("yyyy-mm-dd hh:mm");
setWidths(summarySheet, [240, 160, 40, 180, 120, 120]);

summarySheet.getRange("D3:E3").values = [["Provider", "Result Rows"]];
summarySheet.getRangeByIndexes(3, 3, providerCounts.length, 2).values = providerCounts;
setHeader(summarySheet.getRange("D3:E3"));

summarySheet.getRange("D9:E9").values = [["Inferred Status", "Rows"]];
summarySheet.getRangeByIndexes(9, 3, statusCounts.length, 2).values = statusCounts;
setHeader(summarySheet.getRange("D9:E9"));

notesSheet.getRange("A1:B1").merge();
notesSheet.getRange("A1").values = [["Extraction Notes"]];
notesSheet.getRange("A1").format = {
  fill: "#17365D",
  font: { bold: true, color: "#FFFFFF", size: 14 },
};
notesSheet.getRange("A3:B9").values = [
  ["Scope", "All PDFs in the local labs folder were reviewed and text-layer extracted."],
  ["Method", "Provider-specific parsing for LabCorp table rows, Quest vertical result blocks, and Lee Health/MyChart result blocks."],
  ["Audit fields", "Use Source File and Page to trace each row back to the source PDF."],
  ["Duplicates", "Duplicate reports are retained when they exist as separate PDF files."],
  ["Reference ranges", "Raw reference text is preserved; min/max are parsed where the text format allowed a reliable numeric parse."],
  ["Flags", "Reported flags are retained separately from inferred status."],
  ["Caution", "This workbook is for personal data organization and should be validated against the PDF before clinical decisions."],
];
notesSheet.getRange("A3:A9").format = { font: { bold: true }, fill: "#D9EAF7" };
notesSheet.getRange("B3:B9").format = { wrapText: true };
setWidths(notesSheet, [160, 680, 80, 80]);

for (const sheet of [summarySheet, resultsSheet, filesSheet, notesSheet]) {
  sheet.showGridLines = false;
  const used = sheet.getUsedRange();
  used.format.font = { name: "Aptos", size: 10 };
}

await fs.mkdir(outputDir, { recursive: true });

async function savePreview(sheetName, range, fileName) {
  const blob = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, fileName), new Uint8Array(await blob.arrayBuffer()));
}

await savePreview("Summary", "A1:F20", "preview_summary.png");
await savePreview("All Results", "A1:P25", "preview_all_results.png");
await savePreview("Files Reviewed", "A1:F15", "preview_files_reviewed.png");
await savePreview("Extraction Notes", "A1:B12", "preview_extraction_notes.png");

const errorScan = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errorScan.ndjson);

const summaryInspect = await workbook.inspect({
  kind: "table",
  range: "Summary!A1:E12",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 5,
});
console.log(summaryInspect.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);
console.log(workbookPath);
