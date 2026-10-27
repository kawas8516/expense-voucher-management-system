// builds a CSV file in the browser and downloads it
// columns: [[header, (row) => value], ...]
export function downloadCsv(filename, columns, rows) {
  const cell = (value) => {
    let s = value === null || value === undefined ? "" : String(value);
    // a cell starting with = + - @ could run as a formula in Excel
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };

  const lines = [columns.map(([header]) => cell(header)).join(",")];
  for (const row of rows) {
    lines.push(columns.map(([, get]) => cell(get(row))).join(","));
  }

  // BOM so Excel reads the file as UTF-8 (₹ and names show correctly)
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
