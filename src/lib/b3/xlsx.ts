import * as XLSX from "xlsx";

/**
 * Lê o primeiro sheet de um arquivo XLSX e retorna as linhas como arrays de
 * células (valores brutos). A primeira linha normalmente é o cabeçalho.
 */
export function readXlsxRows(buffer: Buffer): unknown[][] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return [];

  return XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: "",
  }) as unknown[][];
}
