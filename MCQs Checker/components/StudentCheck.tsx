
import React, { useState } from 'react';
import { AnswerKey, StudentResult } from '../types';
import { processAnswerSheet } from '../geminiService';
import { calculateGrade } from '../App';

interface StudentCheckProps {
  masterKey: AnswerKey | null;
  results: StudentResult[];
  onAddResults: (results: StudentResult[]) => void;
}

interface ProcessStatus {
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: StudentResult;
}

const StudentCheck: React.FC<StudentCheckProps> = ({ masterKey, results, onAddResults }) => {
  const [queue, setQueue] = useState<ProcessStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);

  if (!masterKey) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
        <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Setup Required</h2>
        <p className="text-gray-500 font-medium mb-8">You must define a Master Answer Key before grading student papers.</p>
      </div>
    );
  }

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const initialQueue: ProcessStatus[] = (Array.from(files) as File[]).map(f => ({
      fileName: f.name,
      status: 'pending'
    }));

    setQueue(initialQueue);
    setIsProcessing(true);
    setShowSummary(false);

    const processedResults: StudentResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setQueue(prev => prev.map((item, idx) => 
        idx === i ? { ...item, status: 'processing' } : item
      ));

      try {
        const base64 = await fileToBase64(file);
        
        if (i > 0) await new Promise(r => setTimeout(r, 1500));

        const rawResult = await processAnswerSheet(base64, false);
        
        const studentAnswers: Record<number, string> = {};
        const isCorrect: Record<number, boolean> = {};
        let score = 0;

        rawResult.answers.forEach((a: any) => {
          const qNum = a.questionNumber;
          const ans = (a.answer || '').toUpperCase();
          studentAnswers[qNum] = ans;
          
          if (masterKey.answers[qNum] === ans && ans !== '') {
            isCorrect[qNum] = true;
            score++;
          } else {
            isCorrect[qNum] = false;
          }
        });

        const percentage = (score / masterKey.totalQuestions) * 100;
        const result: StudentResult = {
          id: `${Date.now()}-${i}`,
          studentName: rawResult.studentName || `Student ${i + 1}`,
          studentId: rawResult.studentId || 'N/A',
          score: score,
          totalQuestions: masterKey.totalQuestions,
          percentage: percentage,
          grade: calculateGrade(percentage),
          answers: studentAnswers,
          isCorrect: isCorrect,
          checkedAt: new Date().toISOString(),
          imageUrl: base64
        };

        processedResults.push(result);
        setQueue(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'completed', result } : item
        ));
      } catch (err: any) {
        console.error(`Processing error for ${file.name}:`, err);
        setQueue(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'error', error: 'API Timeout or Size Limit' } : item
        ));
      }
    }

    setIsProcessing(false);
    onAddResults(processedResults);
    setShowSummary(processedResults.length > 0);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Result Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-slideUp max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between bg-indigo-600 text-white">
              <div>
                <h3 className="text-xl font-black tracking-tight">{selectedResult.studentName}</h3>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-0.5">ID: {selectedResult.studentId}</p>
              </div>
              <button 
                onClick={() => setSelectedResult(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Score</p>
                  <p className="text-2xl font-black text-gray-900">{selectedResult.score}/{selectedResult.totalQuestions}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grade</p>
                  <p className={`text-2xl font-black ${
                    selectedResult.percentage >= 75 ? 'text-emerald-600' : selectedResult.percentage >= 50 ? 'text-amber-600' : 'text-rose-600'
                  }`}>{selectedResult.grade}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Percentage</p>
                  <p className="text-2xl font-black text-gray-900">{selectedResult.percentage.toFixed(0)}%</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b pb-2">Answer Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.keys(masterKey.answers).sort((a,b) => Number(a)-Number(b)).map((qNum) => {
                    const qInt = Number(qNum);
                    const studentAns = selectedResult.answers[qInt] || '-';
                    const masterAns = masterKey.answers[qInt];
                    const isCorrect = selectedResult.isCorrect[qInt];

                    return (
                      <div key={qNum} className={`flex items-center justify-between p-3 rounded-xl border ${
                        isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-black text-gray-400 w-6">#{qNum}</span>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-500 uppercase leading-none mb-1">Student</span>
                            <span className={`font-black ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>{studentAns}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-gray-500 uppercase leading-none mb-1">Master</span>
                            <span className="font-black text-gray-900">{masterAns}</span>
                          </div>
                        </div>
                        <div className="ml-2">
                          {isCorrect ? (
                            <div className="bg-emerald-500 text-white p-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                          ) : (
                            <div className="bg-rose-500 text-white p-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedResult(null)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-lg">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Batch Grading Engine</h2>
            <p className="text-gray-500 font-medium">Upload student sheets. Images are automatically downscaled to ensure reliable AI processing. Click any result to see details.</p>
          </div>
          <label className={`cursor-pointer group flex flex-col items-center justify-center px-10 py-12 border-4 border-dashed rounded-3xl transition-all ${
            isProcessing ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50' : 'bg-indigo-50 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-100'
          }`}>
            <div className="bg-indigo-600 text-white p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-xl shadow-indigo-200 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <span className="text-indigo-900 font-black">Upload Student Sheets</span>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              accept="image/*" 
              onChange={handleBatchUpload} 
              disabled={isProcessing} 
            />
          </label>
        </div>

        {queue.length > 0 && (
          <div className="mt-12 space-y-6 animate-slideUp">
            <h3 className="text-lg font-black text-gray-900 border-b pb-4">Processing Queue</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => item.status === 'completed' && item.result && setSelectedResult(item.result)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    item.status === 'processing' ? 'bg-indigo-50 border-indigo-300 animate-pulse' : 
                    item.status === 'completed' ? 'bg-emerald-50 border-emerald-200 hover:shadow-md cursor-pointer hover:border-emerald-300' : 
                    item.status === 'error' ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className="text-xs font-black text-gray-400">{idx + 1}.</span>
                    <p className="text-sm font-bold text-gray-900 truncate">{item.fileName}</p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {item.status === 'completed' ? (
                      <span className="text-sm font-black text-emerald-600">{item.result?.grade}</span>
                    ) : item.status === 'error' ? (
                      <span className="text-[10px] font-black text-rose-600 uppercase" title={item.error}>Error</span>
                    ) : item.status === 'processing' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showSummary && (
        <div className="animate-slideUp bg-white p-8 rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Grading Report</h3>
            <button 
              onClick={() => window.print()}
              className="text-indigo-600 font-bold text-sm flex items-center hover:underline"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print Results
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-4 text-xs font-black text-gray-400 uppercase px-4">Student</th>
                  <th className="pb-4 text-xs font-black text-gray-400 uppercase px-4">Raw Score</th>
                  <th className="pb-4 text-xs font-black text-gray-400 uppercase px-4 text-center">Grade</th>
                  <th className="pb-4 text-xs font-black text-gray-400 uppercase px-4 text-right">Progress</th>
                  <th className="pb-4 text-xs font-black text-gray-400 uppercase px-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {queue.filter(q => q.status === 'completed' && q.result).map((q) => {
                  const r = q.result!;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors group" onClick={() => setSelectedResult(r)}>
                      <td className="py-5 px-4">
                        <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{r.studentName}</span>
                        <p className="text-[10px] text-gray-400 font-medium">ID: {r.studentId}</p>
                      </td>
                      <td className="py-5 px-4 font-black text-gray-900">{r.score}/{r.totalQuestions}</td>
                      <td className="py-5 px-4 text-center">
                        <span className={`inline-block w-10 py-1 rounded-lg font-black text-white text-sm ${
                          r.percentage >= 75 ? 'bg-emerald-500' : r.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}>
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <span className="text-sm font-black text-gray-900">{r.percentage.toFixed(0)}%</span>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <button className="text-indigo-600 hover:text-indigo-800 p-1">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCheck;
