
import React from 'react';
import { AnswerKey, StudentResult, AppTab, Grade } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface DashboardProps {
  masterKey: AnswerKey | null;
  results: StudentResult[];
  onClearData: () => void;
  onNavigate: (tab: AppTab) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ masterKey, results, onClearData, onNavigate }) => {
  const averageScore = results.length > 0 
    ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1)
    : 0;
  
  const topScore = results.length > 0
    ? Math.max(...results.map(r => r.score))
    : 0;

  const gradeBreakdown = [
    { grade: 'A+', count: 0, color: '#10b981' },
    { grade: 'A', count: 0, color: '#34d399' },
    { grade: 'B', count: 0, color: '#60a5fa' },
    { grade: 'C', count: 0, color: '#fbbf24' },
    { grade: 'D', count: 0, color: '#f97316' },
    { grade: 'F', count: 0, color: '#ef4444' },
  ];

  results.forEach(r => {
    const idx = gradeBreakdown.findIndex(g => g.grade === r.grade);
    if (idx !== -1) gradeBreakdown[idx].count++;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Competition Dashboard</h1>
          <p className="text-gray-500 font-medium">Real-time analysis of grand assessment results.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onNavigate(AppTab.CHECK_SHEETS)}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Batch Check
          </button>
          <button 
            onClick={onClearData}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 bg-white rounded-xl font-bold hover:bg-gray-50 transition-all"
          >
            Clear Data
          </button>
        </div>
      </div>

      {!masterKey ? (
        <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl p-16 text-center">
          <div className="mx-auto h-20 w-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-inner">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          </div>
          <h3 className="text-2xl font-black text-indigo-900 mb-2">Master Key Required</h3>
          <p className="text-indigo-600 mb-8 max-w-md mx-auto font-medium">Upload the official answer sheet template to enable AI-powered grading for student papers.</p>
          <button 
            onClick={() => onNavigate(AppTab.MASTER_KEY)}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition transform hover:-translate-y-1 shadow-xl shadow-indigo-200"
          >
            Set Master Key Now
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Students" value={results.length.toString()} subValue="Participants" icon="users" color="indigo" />
            <StatCard title="Average Score" value={`${averageScore}`} subValue={`Out of ${masterKey.totalQuestions}`} icon="trending" color="emerald" />
            <StatCard title="Highest Score" value={`${topScore}`} subValue="Top Performer" icon="award" color="amber" />
            <StatCard title="Master Key" value={masterKey.name} subValue={`${masterKey.totalQuestions} Questions`} icon="key" color="slate" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 mb-8">Grade Distribution</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 14, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50}>
                      {gradeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
              <h3 className="text-xl font-black text-gray-900 mb-6">Recent Gradings</h3>
              <div className="space-y-4 flex-grow overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {results.slice(-10).reverse().map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition border border-transparent hover:border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-white ${
                        r.grade === 'A+' || r.grade === 'A' ? 'bg-emerald-500' : 
                        r.grade === 'B' ? 'bg-blue-500' : 
                        r.grade === 'C' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}>
                        {r.grade}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-none">{r.studentName || 'Anonymous'}</p>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">{new Date(r.checkedAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900">{r.score}/{r.totalQuestions}</p>
                      <p className="text-[10px] text-indigo-600 font-black uppercase">{r.percentage.toFixed(0)}%</p>
                    </div>
                  </div>
                ))}
                {results.length === 0 && (
                  <div className="text-center py-20">
                    <div className="inline-block p-4 bg-gray-100 rounded-2xl mb-4 opacity-50">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    </div>
                    <p className="text-gray-400 font-bold">No results recorded.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; subValue: string; icon: string; color: 'indigo' | 'emerald' | 'amber' | 'slate' }> = ({ title, value, subValue, icon, color }) => {
  const styles = {
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    slate: 'bg-slate-50 text-slate-600 ring-slate-100',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{title}</p>
        <div className={`p-2 rounded-lg ring-1 ${styles[color]}`}>
          {icon === 'users' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          {icon === 'trending' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          {icon === 'award' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
          {icon === 'key' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs font-bold text-gray-400 mt-1">{subValue}</p>
    </div>
  );
};

export default Dashboard;
