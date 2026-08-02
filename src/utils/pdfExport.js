/**
 * PDF & CSV Export Utilities for CHW Healthcare Platform
 */

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
}

/**
 * Triggers clean printable PDF view for healthcare reports
 * @param {string} title - Report title
 * @param {string} htmlContent - HTML formatted content to print
 */
export function printPDFReport(title, htmlContent) {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
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
            <div class="title">${title}</div>
            <div class="meta">AI-Powered Community Health Worker Platform | Date: ${new Date().toLocaleDateString()}</div>
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
  const html = `
    <div style="padding: 10px;">
      <h3 style="color: #0284c7;">Clinical Profile: ${patient.name} (ID: ${patient.id})</h3>
      <p><strong>Demographics:</strong> ${patient.age} Yrs | ${patient.gender} | ${patient.village || 'Community Sector'}</p>
      <p><strong>Contact:</strong> ${patient.phone || '+91 98765 00000'}</p>
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
          <td>${patient.systolic}/${patient.diastolic} mmHg</td>
          <td><span class="badge badge-warning">${patient.evaluation?.hypertension?.category || 'Stage 1 Hypertension'}</span></td>
        </tr>
        <tr>
          <td>Blood Glucose (${patient.glucoseType || 'fasting'})</td>
          <td>${patient.glucose} mg/dL</td>
          <td><span class="badge badge-high">${patient.evaluation?.diabetes?.category || 'Diabetic Threshold'}</span></td>
        </tr>
        <tr>
          <td>BMI Index</td>
          <td>${patient.bmi || '24.5'}</td>
          <td><span class="badge badge-low">Normal Range</span></td>
        </tr>
      </table>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 12px 0;"/>
      <h4 style="color: #1e3a8a;">Prescribed Medications</h4>
      <ul>
        ${(patient.medicines || []).map(m => `<li><strong>${m.name}</strong> ${m.dosage} - ${m.frequency} (Scheduled: ${m.time})</li>`).join('')}
      </ul>
    </div>
  `;
  printPDFReport(`Patient Health Passport - ${patient.name}`, html);
}
