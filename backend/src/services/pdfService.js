const PDFDocument = require('pdfkit');

const fmt = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));
const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '—');
const fmtNum = (n) => (n === null || n === undefined ? '—' : Number(n).toFixed(3));

// Builds a PDF Buffer for one sheet (header + job blocks + measurement tables).
// Resolves once the document has finished streaming.
function generateSheetPdf(sheet, labSettings) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // --- Letterhead ---
    doc.fontSize(16).text(labSettings?.lab_name || 'Calibration Laboratory', { align: 'left' });
    doc.fontSize(9).fillColor('#555');
    if (labSettings?.accreditation_no) doc.text(`Accreditation: ${labSettings.accreditation_no}`);
    if (labSettings?.address) doc.text(labSettings.address);
    if (labSettings?.phone) doc.text(`Phone: ${labSettings.phone}`);
    doc.fillColor('#000').moveDown(0.5);

    doc.fontSize(14).text('CALIBRATION DATA SHEET', { align: 'center' });
    doc.fontSize(9).fillColor('#555').text('Form ref: HF-01/A/1', { align: 'center' });
    doc.fillColor('#000').moveDown(1);

    // --- Sheet header ---
    doc.fontSize(10);
    headerRow(doc, 'Sheet No.', sheet.sheet_no, 'Party Name', sheet.party_name);
    headerRow(doc, 'SRF No.', sheet.srf_no, 'Item Received Date', fmtDate(sheet.item_received_date));
    headerRow(doc, 'Condition on Received', sheet.condition_on_received, 'Location', sheet.location);
    headerRow(doc, 'Description of Item', sheet.description_of_item, 'Calibrated By', sheet.calibrated_by);
    if (sheet.remark) {
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').text('Remark: ', { continued: true }).font('Helvetica').text(fmt(sheet.remark));
    }
    doc.moveDown(1);

    // --- Job blocks ---
    sheet.job_blocks.forEach((block, i) => {
      if (doc.y > 650) doc.addPage();

      doc.fontSize(11).font('Helvetica-Bold')
        .text(`Job ${i + 1}: ${fmt(block.instrument_name)}`, { underline: true });
      doc.font('Helvetica').fontSize(9).moveDown(0.3);

      headerRow(doc, 'Job No.', block.job_no, 'I.D. No.', block.id_no);
      headerRow(doc, 'Make/Model', block.make_model, 'Sr. No.', block.sr_no);
      headerRow(doc, 'Type', block.type, 'Range', block.range);
      headerRow(doc, 'Resolution', block.resolution, 'Accuracy', block.accuracy);
      headerRow(doc, 'Cal. Date', fmtDate(block.cal_date), 'Due Date', fmtDate(block.due_date));
      headerRow(doc, 'Standard Used', block.standard_used, 'Location', block.location);
      headerRow(
        doc,
        'Environment',
        `${fmt(block.temp_c)}°C, ${fmt(block.rh_percent)}% RH, ${fmt(block.air_pressure_mbar)} mbar`,
        'Detail',
        block.detail
      );
      doc.moveDown(0.5);

      // Measurement table
      if (block.measurement_rows.length > 0) {
        drawMeasurementTable(doc, block.measurement_rows);
      } else {
        doc.fontSize(9).fillColor('#888').text('No measurement rows recorded.').fillColor('#000');
      }
      doc.moveDown(1);
    });

    if (labSettings?.footer_note) {
      doc.fontSize(8).fillColor('#888').text(labSettings.footer_note, { align: 'center' });
    }

    doc.end();
  });
}

function headerRow(doc, label1, value1, label2, value2) {
  const startY = doc.y;
  const colWidth = 250;
  doc.font('Helvetica-Bold').text(`${label1}: `, 40, startY, { continued: true, width: colWidth });
  doc.font('Helvetica').text(fmt(value1));
  doc.font('Helvetica-Bold').text(`${label2}: `, 40 + colWidth + 20, startY, { continued: true, width: colWidth });
  doc.font('Helvetica').text(fmt(value2));
  doc.moveDown(0.4);
}

function drawMeasurementTable(doc, rows) {
  const headers = ['Range', 'Cal Pt', 'Set', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'Avg', 'Error'];
  const colWidths = [70, 45, 40, 32, 32, 32, 32, 32, 32, 42, 42];
  const startX = 40;
  let y = doc.y;

  doc.fontSize(7).font('Helvetica-Bold');
  let x = startX;
  headers.forEach((h, i) => {
    doc.text(h, x, y, { width: colWidths[i], align: 'center' });
    x += colWidths[i];
  });
  y += 12;
  doc.moveTo(startX, y).lineTo(x, y).strokeColor('#ccc').stroke();
  y += 2;

  doc.font('Helvetica');
  rows.forEach((row) => {
    const cells = [
      row.parameter_range, row.cal_point, fmtNum(row.set_value_uuc),
      fmtNum(row.x1), fmtNum(row.x2), fmtNum(row.x3), fmtNum(row.x4), fmtNum(row.x5), fmtNum(row.x6),
      fmtNum(row.average), fmtNum(row.error),
    ];
    x = startX;
    cells.forEach((c, i) => {
      doc.text(fmt(c), x, y, { width: colWidths[i], align: 'center' });
      x += colWidths[i];
    });
    y += 12;
    if (y > 760) {
      doc.addPage();
      y = 40;
    }
  });

  doc.y = y + 4;
  doc.strokeColor('#000');
}

module.exports = { generateSheetPdf };
