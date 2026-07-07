const TITLE_GREEN = 'FF1B5E20';
const HEADER_GREEN = 'FF2E7D32';
const HEADER_AMBER = 'FFB8860B';
const ZEBRA_GREEN = 'FFEFF6EC';
const BORDER_COLOR = 'FFDDE5DD';

function safeFilename(name) {
  return name.replace(/[^a-z0-9]+/gi, '_');
}

function styleWorksheet(sheet, { title, currencyKeys = [], highlightKeys = [] }) {
  const columnCount = sheet.columns.length;

  sheet.insertRow(1, []);
  sheet.mergeCells(1, 1, 1, columnCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 15, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITLE_GREEN } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 32;

  const headerRow = sheet.getRow(2);
  headerRow.height = 26;
  headerRow.eachCell((cell, colNumber) => {
    const key = sheet.columns[colNumber - 1].key;
    const isHighlight = highlightKeys.includes(key);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11.5 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isHighlight ? HEADER_AMBER : HEADER_GREEN } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: TITLE_GREEN } },
      bottom: { style: 'thin', color: { argb: TITLE_GREEN } },
      left: { style: 'thin', color: { argb: TITLE_GREEN } },
      right: { style: 'thin', color: { argb: TITLE_GREEN } }
    };
  });

  sheet.views = [{ state: 'frozen', ySplit: 2 }];

  sheet.columns.forEach(col => {
    if (currencyKeys.includes(col.key)) {
      col.numFmt = '"₹"#,##0.00';
    }
  });

  for (let i = 3; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    row.height = 19;
    const isEven = i % 2 === 0;
    row.eachCell({ includeEmpty: true }, cell => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } }
      };
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_GREEN } };
      }
    });
  }
}

module.exports = { styleWorksheet, safeFilename };
