/**
 * PDF & CSV Export Utilities for CHW Healthcare Platform
 */

export function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Downloads data as a formatted CSV file
 * @param {Array} data - Array of objects
 * @param {string} filename - Output file name
 */
export function exportToCSV(data, filename = 'report.csv') {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + (val ?? '')).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers clean printable PDF view for healthcare reports
 * @param {string} title - Report title
 * @param {string} htmlContent - HTML formatted content to print
 */
export function printPDFReport(title, htmlContent) {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) return;
  const safeTitle = escapeHTML(title);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${safeTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #1e40af; }
          .meta { font-size: 13px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #f1f5f9; text-align: left; padding: 8px; border: 1px solid #cbd5e1; font-size: 13px; }
          td { padding: 8px; border: 1px solid #cbd5e1; font-size: 12px; }
          .badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
          .badge-critical { background: #fee2e2; color: #991b1b; }
          .badge-high { background: #ffedd5; color: #9a3412; }
          .badge-moderate { background: #fef9c3; color: #854d0e; }
          .badge-low { background: #dcfce7; color: #166534; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; pt: 12px; font-size: 11px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${safeTitle}</div>
            <div class="meta">Guideline-Informed Community Health Platform | Date: ${new Date().toLocaleDateString()}</div>
          </div>
          <div>
            <strong>Confidential Medical Document</strong>
          </div>
        </div>
        ${htmlContent}
        <div class="footer">Generated automatically by CHW Healthcare Platform. Approved for official clinical & administrative use.</div>
        <script>
          setTimeout(() => {
            window.print();
          }, 500);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Generates printable PDF Health Passport for individual patient
 * @param {Object} patient - Patient record
 */
export function exportPatientSummaryPDF(patient) {
  if (!patient) return;
  const safe = (value) => escapeHTML(value);
  const html = `
    <div style="padding: 10px;">
      <h3 style="color: #0284c7;">Clinical Profile: ${safe(patient.name)} (ID: ${safe(patient.id)})</h3>
      <p><strong>Demographics:</strong> ${safe(patient.age)} Yrs | ${safe(patient.gender)} | ${safe(patient.village || patient.address || 'Community Sector')}</p>
      <p><strong>Contact:</strong> ${safe(patient.phone || 'Not recorded')}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 12px 0;"/>
      <h4 style="color: #1e3a8a;">Latest Clinical Vitals & Risk Score</h4>
      <table>
        <tr>
          <th>Vital Metric</th>
          <th>Measured Value</th>
          <th>Clinical Status</th>
        </tr>
        <tr>
          <td>Blood Pressure</td>
          <td>${safe(patient.systolic)}/${safe(patient.diastolic)} mmHg</td>
          <td><span class="badge badge-warning">${safe(patient.evaluation?.hypertension?.category || 'Not assessed')}</span></td>
        </tr>
        <tr>
          <td>Blood Glucose (${safe(patient.glucoseType || 'not recorded')})</td>
          <td>${safe(patient.glucose)} mg/dL</td>
          <td><span class="badge badge-high">${safe(patient.evaluation?.diabetes?.category || 'Not assessed')}</span></td>
        </tr>
        <tr>
          <td>BMI Index</td>
          <td>${safe(patient.bmi || 'Not recorded')}</td>
          <td><span class="badge badge-low">Recorded</span></td>
        </tr>
      </table>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 12px 0;"/>
      <h4 style="color: #1e3a8a;">Prescribed Medications</h4>
      <ul>
        ${(patient.medicines || []).map(m => `<li><strong>${safe(m.name)}</strong> ${safe(m.dosage)} - ${safe(m.frequency)} (Scheduled: ${safe(m.time)})</li>`).join('')}
      </ul>
    </div>
  `;
  printPDFReport(`Patient Health Passport - ${patient.name || 'Patient'}`, html);
}
