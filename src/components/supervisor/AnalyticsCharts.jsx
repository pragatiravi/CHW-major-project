import React from 'react';
import { PieChart, BarChart2, TrendingUp, Users } from 'lucide-react';

export default function AnalyticsCharts({ patients, chwList }) {
  // 1. Calculate Disease Prevalence
  let htCount = 0;
  let dbCount = 0;
  let bothCount = 0;
  let normalCount = 0;

  patients.forEach(p => {
    const evalData = p.evaluation || {};
    const htHigh = evalData.hypertension?.riskLevel === 'High' || evalData.hypertension?.riskLevel === 'Critical';
    const dbHigh = evalData.diabetes?.riskLevel === 'High' || evalData.diabetes?.riskLevel === 'Critical';

    if (htHigh && dbHigh) bothCount++;
    else if (htHigh) htCount++;
    else if (dbHigh) dbCount++;
    else normalCount++;
  });

  const total = patients.length || 1;

  // 2. Age Group Distribution
  const ageGroups = { '18-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
  patients.forEach(p => {
    if (p.age <= 35) ageGroups['18-35']++;
    else if (p.age <= 50) ageGroups['36-50']++;
    else if (p.age <= 65) ageGroups['51-65']++;
    else ageGroups['65+']++;
  });

  return (
    <div className="analytics-charts-grid grid-2-col gap-4">
      {/* Chart 1: Disease Prevalence Breakdown */}
      <div className="card-box bg-secondary border-slate-800">
        <h4 className="chart-card-title flex items-center gap-1">
          <PieChart size={16} className="text-indigo-400" /> Chronic Disease Prevalence Distribution
        </h4>
        
        <div className="progress-bars-container mt-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-rose-400 font-bold">Hypertension Only</span>
              <span>{htCount} ({Math.round((htCount / total) * 100)}%)</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill bg-rose-500" style={{ width: `${(htCount / total) * 100}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-amber-400 font-bold">Diabetes Only</span>
              <span>{dbCount} ({Math.round((dbCount / total) * 100)}%)</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill bg-amber-500" style={{ width: `${(dbCount / total) * 100}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-purple-400 font-bold">Comorbid (Both HTN & Diabetes)</span>
              <span>{bothCount} ({Math.round((bothCount / total) * 100)}%)</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill bg-purple-500" style={{ width: `${(bothCount / total) * 100}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-emerald-400 font-bold">Low Risk / Healthy</span>
              <span>{normalCount} ({Math.round((normalCount / total) * 100)}%)</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill bg-emerald-500" style={{ width: `${(normalCount / total) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart 2: Age Group Risk Distribution */}
      <div className="card-box bg-secondary border-slate-800">
        <h4 className="chart-card-title flex items-center gap-1">
          <BarChart2 size={16} className="text-emerald-400" /> Patient Age Demographics
        </h4>

        <div className="histogram-bars-container mt-6 flex items-end justify-between h-36 px-4">
          {Object.entries(ageGroups).map(([group, count]) => {
            const heightPercent = Math.max(15, Math.round((count / total) * 100));

            return (
              <div key={group} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs font-bold text-white">{count}</span>
                <div className="histogram-bar bg-gradient-to-t from-indigo-600 to-indigo-400 w-10 rounded-t-md transition-all duration-500" style={{ height: `${heightPercent}%` }}></div>
                <span className="text-2xs text-gray-400 mt-1">{group} yrs</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 3: CHW Field Activity Metrics */}
      <div className="card-box bg-secondary border-slate-800 col-span-2">
        <h4 className="chart-card-title flex items-center gap-1">
          <Users size={16} className="text-blue-400" /> CHW Field Performance Metrics
        </h4>

        <div className="chw-metrics-grid grid-3-col gap-3 mt-4">
          {chwList && chwList.map((chw) => (
            <div key={chw.id} className="card-box bg-slate-900 border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <strong className="text-white text-sm">{chw.name}</strong>
                  <div className="text-2xs text-gray-400">{chw.zone}</div>
                </div>
                <span className="badge badge-success text-2xs">Active</span>
              </div>
              <div className="grid-2-col gap-2 mt-3 pt-2 border-t border-slate-800 text-xs">
                <div><span>Patients:</span> <strong>{chw.totalPatients}</strong></div>
                <div><span>Screenings:</span> <strong>{chw.screeningsDone}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
