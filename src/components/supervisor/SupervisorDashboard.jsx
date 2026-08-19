import { useState } from 'react';
import { 
  Users, 
  BarChart2, 
  FileText, 
  Hospital, 
  Download, 
  Printer, 
  CheckCircle2,
  BrainCircuit,
  Search
} from 'lucide-react';
import AnalyticsCharts from './AnalyticsCharts';
import { escapeHTML, exportToCSV, printPDFReport } from '../../utils/pdfExport';
import { useToast } from '../shared/ToastContainer';
import PatientDetailModal from '../shared/PatientDetailModal';

export default function SupervisorDashboard({ 
  patients = [], 
  chwList = [], 
  syncLogs = [], 
  activeSection = 'overview'
}) {
  const { toastSuccess } = useToast();
  const activeTab = activeSection || 'overview';
  const [chartView, setChartView] = useState('risk'); // 'risk' | 'prevalence' | 'age'
  const [filterRisk, setFilterRisk] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectedPatient, setInspectedPatient] = useState(null);

  const criticalCount = patients.filter(p => (p.evaluation?.overallRiskLevel || p.evaluation?.overall?.riskLevel) === 'Critical').length;
  const highCount = patients.filter(p => (p.evaluation?.overallRiskLevel || p.evaluation?.overall?.riskLevel) === 'High').length;
  const pendingReferralCount = patients.filter(p => p.referral && p.referral.status === 'Pending').length;

  const filteredPatients = patients.filter(p => {
    const risk = p.evaluation?.overallRiskLevel || p.evaluation?.overall?.riskLevel || 'Low';
    const matchesRisk = filterRisk === 'all' || risk.toLowerCase() === filterRisk.toLowerCase();
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
      Risk_Level: p.evaluation?.overallRiskLevel || p.evaluation?.overall?.riskLevel || 'Low',
      Referral_Required: p.evaluation?.requiresReferral ? 'Yes' : 'No',
      Referral_Status: p.referral?.status || 'N/A',
      Assigned_CHW: p.assignedCHW || 'Sunita Patil'
    }));

    exportToCSV(reportData, `Supervisor_Population_Report_${new Date().toISOString().split('T')[0]}.csv`);
    toastSuccess('Population health audit CSV generated.');
  };

  const handlePrintPDF = () => {
    const safe = (value) => escapeHTML(value);
    const tableRows = filteredPatients.map(p => `
      <tr>
        <td><strong>${safe(p.id)}</strong></td>
        <td>${safe(p.name)}</td>
        <td>${safe(p.age)} yrs (${safe(p.gender)})</td>
        <td>${safe(p.systolic)}/${safe(p.diastolic)} mmHg</td>
        <td>${safe(p.glucose)} mg/dL</td>
        <td><span class="badge badge-${safe((p.evaluation?.overallRiskLevel || 'Low').toLowerCase())}">${safe(p.evaluation?.overallRiskLevel || 'Low')}</span></td>
        <td>${safe(p.referral?.status || 'None')}</td>
        <td>${safe(p.assignedCHW || 'Sunita Patil')}</td>
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
            <th>Age / Gender</th>
            <th>Blood Pressure</th>
            <th>Glucose</th>
            <th>Risk Level</th>
            <th>Referral Status</th>
            <th>Assigned CHW</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;

    printPDFReport('Supervisor Program Summary', htmlContent);
    toastSuccess('Printable report opened.');
  };

  return (
    <div className="portal-content-container space-y-6">
      {/* Top Banner */}
      <div className="card-box bg-white p-5 flex justify-between items-center flex-wrap gap-4 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <BarChart2 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {activeTab === 'analytics' ? 'Population Health Analytics' : activeTab === 'chws' ? 'CHW Field Activity' : activeTab === 'referrals' ? 'Referral Operations' : activeTab === 'reports' ? 'Program Reports' : 'Health Program Supervisor Dashboard'}
            </h1>
            <p className="text-xs text-slate-500">Population health, field operations, referral oversight, and auditable reporting</p>
          </div>
        </div>

        {activeTab === 'reports' && (
          <div className="flex gap-2">
            <button className="btn btn-secondary text-xs flex items-center gap-1.5" onClick={handlePrintPDF}>
              <Printer size={14} /> Print Summary
            </button>
            <button className="btn btn-primary text-xs flex items-center gap-1.5" onClick={handleDownloadCSVReport}>
              <Download size={14} /> Export CSV Audit
            </button>
          </div>
        )}
      </div>

      {/* Top 4 Core Metrics */}
      {activeTab === 'overview' && (
      <div className="grid-4-col gap-4">
        <div className="metric-box border-l-4 border-l-amber-600">
          <span className="metric-label">Registered Population</span>
          <div className="metric-value">{patients.length}</div>
          <span className="metric-sub">Active community cohort</span>
        </div>

        <div className="metric-box border-l-4 border-l-sky-600">
          <span className="metric-label">Active Field CHWs</span>
          <div className="metric-value text-sky-700">{chwList.length}</div>
          <span className="metric-sub">Frontline field agents</span>
        </div>

        <div className="metric-box border-l-4 border-l-rose-600">
          <span className="metric-label">High / Critical Risk</span>
          <div className="metric-value text-rose-700">{criticalCount + highCount}</div>
          <span className="metric-sub">{criticalCount} Critical • {highCount} High</span>
        </div>

        <div className="metric-box border-l-4 border-l-indigo-600">
          <span className="metric-label">Pending Hospital Referrals</span>
          <div className="metric-value text-indigo-700">{pendingReferralCount}</div>
          <span className="metric-sub">In hospital triage review</span>
        </div>
      </div>
      )}

      {/* Focused Analytics: One Primary Chart with Switcher */}
      {(activeTab === 'overview' || activeTab === 'analytics') && (
      <div className="card-box space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BrainCircuit size={18} className="text-sky-600" /> Population Health Analytics
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Demographic risk stratification and chronic disease distributions</p>
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button 
              className={`btn text-xs ${chartView === 'risk' ? 'btn-primary' : 'text-slate-600'}`}
              onClick={() => setChartView('risk')}
            >
              Risk Distribution
            </button>
            <button 
              className={`btn text-xs ${chartView === 'prevalence' ? 'btn-primary' : 'text-slate-600'}`}
              onClick={() => setChartView('prevalence')}
            >
              Disease Prevalence
            </button>
            <button 
              className={`btn text-xs ${chartView === 'age' ? 'btn-primary' : 'text-slate-600'}`}
              onClick={() => setChartView('age')}
            >
              Age Cohorts
            </button>
          </div>
        </div>

        {/* Render Single Clean Chart */}
        <div className="p-2">
          <AnalyticsCharts patients={patients} view={chartView} />
        </div>
      </div>
      )}

      {/* CHW Field Activity Summary Table */}
      {(activeTab === 'overview' || activeTab === 'chws') && (
      <div className="card-box space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-sky-600" /> CHW Field Caseload Performance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Field worker coverage, screenings completed, and high risk cases identified</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Health Worker</th>
                <th>Assigned Village Sector</th>
                <th>Screenings Completed</th>
                <th>High Risk Identified</th>
                <th>Referrals Dispatched</th>
                <th>Sync Health</th>
              </tr>
            </thead>
            <tbody>
              {chwList.map(chw => (
                <tr key={chw.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="patient-avatar-sm">{chw.name.charAt(0)}</div>
                      <div>
                        <strong className="text-sm text-slate-900 block">{chw.name}</strong>
                        <span className="text-2xs text-slate-400 font-mono">ID: {chw.id} • {chw.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="text-xs text-slate-700">{chw.village}</span></td>
                  <td><strong className="text-xs text-slate-900">{chw.screeningsCompleted}</strong></td>
                  <td><span className="badge badge-risk-high">{chw.highRiskIdentified} cases</span></td>
                  <td><span className="badge badge-primary">{chw.referralsDispatched} referrals</span></td>
                  <td><span className="badge badge-risk-low flex items-center gap-1"><CheckCircle2 size={12} /> Synced</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'referrals' && (
        <section className="card-box space-y-4" aria-labelledby="referral-operations-heading">
          <div className="card-box-header">
            <div>
              <h2 id="referral-operations-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2"><Hospital size={19} className="text-indigo-600" /> Referral Operations</h2>
              <p className="text-xs text-slate-500 mt-1">Monitor pending, approved, and community-managed cases.</p>
            </div>
            <span className="badge badge-risk-moderate">{pendingReferralCount} pending</span>
          </div>
          <div className="grid-2-col gap-4">
            {patients.filter((patient) => patient.referral).map((patient) => (
              <article key={patient.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <strong className="text-sm text-slate-900 block">{patient.name}</strong>
                    <span className="text-xs text-slate-500">{patient.id} · {patient.referral.hospitalName}</span>
                  </div>
                  <span className={`badge ${patient.referral.status === 'Approved' ? 'badge-risk-low' : patient.referral.status === 'Declined' ? 'badge-neutral' : 'badge-risk-moderate'}`}>{patient.referral.status}</span>
                </div>
                <p className="text-xs text-slate-600">{patient.referral.reason}</p>
                <button type="button" className="btn btn-secondary text-xs w-full" onClick={() => setInspectedPatient(patient)}>Inspect clinical record</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'reports' && (
        <section className="card-box space-y-4" aria-labelledby="reports-heading">
          <div className="card-box-header">
            <div>
              <h2 id="reports-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileText size={19} className="text-sky-600" /> Program Report Builder</h2>
              <p className="text-xs text-slate-500 mt-1">Filter the cohort, inspect records, then print or export the current report.</p>
            </div>
            <span className="badge badge-primary">{filteredPatients.length} records · {syncLogs.length} sync events</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="search-bar-sm flex-1">
              <Search size={14} className="text-slate-400" />
              <input className="form-input text-xs" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search name or patient ID" />
            </div>
            <select className="form-input text-xs w-36" value={filterRisk} onChange={(event) => setFilterRisk(event.target.value)} aria-label="Filter report by risk level">
              <option value="all">All risk levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead><tr><th>Patient</th><th>Vitals</th><th>Risk</th><th>Referral</th><th>Assigned CHW</th><th>Action</th></tr></thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td><strong>{patient.name}</strong><span className="block text-2xs text-slate-500">{patient.id}</span></td>
                    <td>{patient.systolic}/{patient.diastolic} mmHg · {patient.glucose} mg/dL</td>
                    <td><span className="badge badge-neutral">{patient.evaluation?.overallRiskLevel || 'Low'}</span></td>
                    <td>{patient.referral?.status || 'None'}</td>
                    <td>{patient.assignedCHW || 'Sunita Patil'}</td>
                    <td><button type="button" className="btn btn-secondary text-xs" onClick={() => setInspectedPatient(patient)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Patient Detail Drawer */}
      {inspectedPatient && (
        <PatientDetailModal 
          patient={inspectedPatient}
          onClose={() => setInspectedPatient(null)}
          onOpenDecisionSupport={() => {}}
          onOpenCounselling={() => {}}
          onOpenReferral={() => {}}
          onOpenMedicationModal={() => {}}
          onDeletePatient={() => {}}
          onAddReport={() => {}}
          userRole="supervisor"
        />
      )}
    </div>
  );
}
