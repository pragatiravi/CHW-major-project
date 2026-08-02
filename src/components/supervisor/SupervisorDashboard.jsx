import React, { useState } from 'react';
import { 
  Users, 
  BarChart2, 
  FileText, 
  Hospital, 
  Download, 
  Printer, 
  Filter, 
  Search, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';
import AnalyticsCharts from './AnalyticsCharts';
import { exportToCSV, printPDFReport } from '../../utils/pdfExport';

export default function SupervisorDashboard({ patients, chwList, syncLogs, onOpenPatientDetail }) {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'chws', 'referrals', 'reports'
  const [reportType, setReportType] = useState('monthly_disease');
  const [filterRisk, setFilterRisk] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const criticalCount = patients.filter(p => p.evaluation?.overall?.riskLevel === 'Critical').length;
  const highCount = patients.filter(p => p.evaluation?.overall?.riskLevel === 'High').length;
  const pendingReferralCount = patients.filter(p => p.referral && p.referral.status === 'Pending').length;

  const filteredPatients = patients.filter(p => {
    const matchesRisk = filterRisk === 'all' || p.evaluation?.overall?.riskLevel?.toLowerCase() === filterRisk.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  const handleDownloadCSVReport = () => {
    const reportData = patients.map(p => ({
      ID: p.id,
      Name: p.name,
      Age: p.age,
      Gender: p.gender,
      Systolic_BP: p.systolic,
      Diastolic_BP: p.diastolic,
      Glucose_mgdL: p.glucose,
      BMI: p.bmi,
      Risk_Level: p.evaluation?.overall?.riskLevel || 'Low',
      Referral_Required: p.evaluation?.overall?.requiresReferral ? 'Yes' : 'No',
      Referral_Status: p.referral?.status || 'N/A',
      Assigned_CHW: p.assignedCHW || 'Sunita Patil'
    }));

    exportToCSV(reportData, `CHW_Supervisor_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handlePrintPDF = () => {
    const tableRows = filteredPatients.map(p => `
      <tr>
        <td><strong>${p.id}</strong></td>
        <td>${p.name}</td>
        <td>${p.age} yrs (${p.gender})</td>
        <td>${p.systolic}/${p.diastolic} mmHg</td>
        <td>${p.glucose} mg/dL</td>
        <td><span class="badge badge-${p.evaluation?.overall?.riskLevel?.toLowerCase()}">${p.evaluation?.overall?.riskLevel}</span></td>
        <td>${p.referral?.status || 'None'}</td>
        <td>${p.assignedCHW || 'Sunita Patil'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <h3>Supervisor Clinical & Program Summary Report</h3>
      <p>Total Patients Filtered: <strong>${filteredPatients.length}</strong> | High/Critical Risk Cases: <strong>${criticalCount + highCount}</strong></p>
      <table>
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Name</th>
            <th>Age/Gender</th>
            <th>Blood Pressure</th>
            <th>Glucose</th>
            <th>AI Risk Level</th>
            <th>Referral Status</th>
            <th>Assigned CHW</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;

    printPDFReport('CHW Supervisor Performance & Population Summary', htmlContent);
  };

  return (
    <div className="portal-container">
      {/* Top Supervisor Header Banner */}
      <div className="portal-header-banner bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="portal-badge-icon bg-indigo-500/20 text-indigo-400">
            <BarChart2 size={28} />
          </div>
          <div>
            <h1 className="portal-title">Supervisor Management & Analytics Dashboard</h1>
            <p className="portal-subtitle">Monitor CHW Field Activity, Population Health Metrics & Hospital Referral Pipelines</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="stat-pill">
            <span className="stat-num text-rose-400">{criticalCount}</span>
            <span className="stat-lbl">Critical Patients</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num text-amber-400">{highCount}</span>
            <span className="stat-lbl">High Risk Patients</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num text-indigo-400">{pendingReferralCount}</span>
            <span className="stat-lbl">Pending Referrals</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="detail-tabs mt-4">
        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          📊 Population Analytics & Charts
        </button>
        <button className={`tab-btn ${activeTab === 'chws' ? 'active' : ''}`} onClick={() => setActiveTab('chws')}>
          👩‍⚕️ CHW Activity Monitor
        </button>
        <button className={`tab-btn ${activeTab === 'referrals' ? 'active' : ''}`} onClick={() => setActiveTab('referrals')}>
          🏥 Referral Pipeline Monitoring
        </button>
        <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          📈 Custom Reports & Exports
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="tab-content mt-4">
        {activeTab === 'analytics' && (
          <AnalyticsCharts patients={patients} chwList={chwList} />
        )}

        {activeTab === 'chws' && (
          <div className="card-box bg-secondary">
            <h3 className="text-lg font-bold text-white mb-3">Community Health Worker Field Performance</h3>
            <div className="grid-3-col gap-4">
              {chwList && chwList.map((chw) => (
                <div key={chw.id} className="card-box bg-slate-900 border-slate-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white">{chw.name}</h4>
                      <p className="text-2xs text-gray-400">{chw.zone} • {chw.phone}</p>
                    </div>
                    <span className="badge badge-success text-2xs">Active</span>
                  </div>
                  <div className="grid-2-col gap-2 mt-3 text-xs pt-2 border-t border-slate-800">
                    <div><span>Assigned Patients:</span> <strong className="text-white">{chw.totalPatients}</strong></div>
                    <div><span>Screenings Completed:</span> <strong className="text-indigo-400">{chw.screeningsDone}</strong></div>
                    <div><span>Pending Local Sync:</span> <strong className="text-amber-400">{chw.pendingSync}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="card-box bg-secondary">
            <h3 className="text-lg font-bold text-white mb-3">Hospital Referral Pipeline Monitoring</h3>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Risk Priority</th>
                    <th>Target Hospital</th>
                    <th>Assigned Doctor</th>
                    <th>Referral Status</th>
                    <th>Date Generated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.filter(p => p.referral).map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong> <span className="text-2xs text-gray-400">({p.id})</span></td>
                      <td><span className={`badge badge-${p.evaluation?.overall?.riskLevel?.toLowerCase()}`}>{p.evaluation?.overall?.riskLevel}</span></td>
                      <td>{p.referral?.hospitalName}</td>
                      <td>{p.referral?.doctorName}</td>
                      <td>
                        <span className={`badge ${p.referral?.status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>
                          {p.referral?.status}
                        </span>
                      </td>
                      <td>{p.referral?.dateGenerated}</td>
                      <td>
                        <button className="btn btn-secondary text-xs flex items-center gap-1" onClick={() => onOpenPatientDetail(p)}>
                          <Eye size={12} /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="card-box bg-secondary">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Custom Healthcare Reports & Data Exports</h3>
                <p className="text-xs text-gray-400">Filter, preview, print, or download PDF/CSV reports for administrative audits.</p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary text-xs flex items-center gap-1" onClick={handlePrintPDF}>
                  <Printer size={14} /> Print PDF Report
                </button>
                <button className="btn btn-primary text-xs flex items-center gap-1" onClick={handleDownloadCSVReport}>
                  <Download size={14} /> Download Excel/CSV
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid-3-col gap-3 mb-4 card-box bg-slate-900 border-slate-700">
              <div className="form-group">
                <label className="text-2xs font-semibold text-gray-400">Report Category</label>
                <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="form-input text-xs">
                  <option value="monthly_disease">Monthly Chronic Disease Statistics</option>
                  <option value="chw_performance">CHW Field Performance Summary</option>
                  <option value="referral_audit">Hospital Referral Pipeline Audit</option>
                  <option value="high_risk_flagged">High & Critical Risk Patients List</option>
                </select>
              </div>

              <div className="form-group">
                <label className="text-2xs font-semibold text-gray-400">Filter by AI Risk Level</label>
                <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="form-input text-xs">
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical Risk</option>
                  <option value="high">High Risk</option>
                  <option value="moderate">Moderate Risk</option>
                  <option value="low">Low Risk</option>
                </select>
              </div>

              <div className="form-group">
                <label className="text-2xs font-semibold text-gray-400">Search Patient Name/ID</label>
                <input 
                  type="text" 
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input text-xs"
                />
              </div>
            </div>

            {/* Reports Data Table */}
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Age / Gender</th>
                    <th>BP (Systolic/Diastolic)</th>
                    <th>Glucose (mg/dL)</th>
                    <th>AI Risk Category</th>
                    <th>Referral Status</th>
                    <th>Assigned CHW</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(p => (
                    <tr key={p.id}>
                      <td><strong className="text-indigo-400 font-mono">{p.id}</strong></td>
                      <td>{p.name}</td>
                      <td>{p.age} yrs ({p.gender})</td>
                      <td>{p.systolic}/{p.diastolic} mmHg</td>
                      <td>{p.glucose} mg/dL</td>
                      <td><span className={`badge badge-${p.evaluation?.overall?.riskLevel?.toLowerCase()}`}>{p.evaluation?.overall?.riskLevel}</span></td>
                      <td>{p.referral?.status || 'None'}</td>
                      <td>{p.assignedCHW || 'Sunita Patil'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
