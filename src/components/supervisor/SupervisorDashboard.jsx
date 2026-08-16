import React, { useState } from 'react';
import { 
  Users, 
  BarChart2, 
  FileText, 
  Hospital, 
  Download, 
  Printer, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  Clock,
  Search
} from 'lucide-react';
import AnalyticsCharts from './AnalyticsCharts';
import { exportToCSV, printPDFReport } from '../../utils/pdfExport';
import { useToast } from '../shared/ToastContainer';
import PatientDetailModal from '../shared/PatientDetailModal';

export default function SupervisorDashboard({ 
  patients = [], 
  chwList = [], 
  syncLogs = [], 
  activeSection = 'overview'
}) {
  const { toastSuccess } = useToast();
  const [activeTab, setActiveTab] = useState(activeSection || 'overview');
  const [chartView, setChartView] = useState('risk'); // 'risk' | 'prevalence' | 'age'
  const [filterRisk, setFilterRisk] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectedPatient, setInspectedPatient] = useState(null);

  React.useEffect(() => {
    if (activeSection) {
      setActiveTab(activeSection);
    }
  }, [activeSection]);

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
    const tableRows = filteredPatients.map(p => `
      <tr>
        <td><strong>${p.id}</strong></td>
        <td>${p.name}</td>
        <td>${p.age} yrs (${p.gender})</td>
        <td>${p.systolic}/${p.diastolic} mmHg</td>
        <td>${p.glucose} mg/dL</td>
        <td><span class="badge badge-${(p.evaluation?.overallRiskLevel || 'Low').toLowerCase()}">${p.evaluation?.overallRiskLevel || 'Low'}</span></td>
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
            <h1 className="text-xl font-bold text-slate-900">Health Program Supervisor Dashboard</h1>
            <p className="text-xs text-slate-500">Population Health Analytics, CHW Field Operations & Audit Reports</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-secondary text-xs flex items-center gap-1.5" onClick={handlePrintPDF}>
            <Printer size={14} /> Print Summary
          </button>
          <button className="btn btn-primary text-xs flex items-center gap-1.5" onClick={handleDownloadCSVReport}>
            <Download size={14} /> Export CSV Audit
          </button>
        </div>
      </div>

      {/* Top 4 Core Metrics */}
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

      {/* Focused Analytics: One Primary Chart with Switcher */}
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

      {/* CHW Field Activity Summary Table */}
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

      {/* Patient Detail Drawer */}
      {inspectedPatient && (
        <PatientDetailModal 
          patient={inspectedPatient}
          onClose={() => setInspectedPatient(null)}
          onOpenAIScreening={() => {}}
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
