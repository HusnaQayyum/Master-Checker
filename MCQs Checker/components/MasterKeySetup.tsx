
import React, { useState } from 'react';
import { AnswerKey } from '../types';
import { processAnswerSheet } from '../geminiService';

interface MasterKeySetupProps {
  masterKey: AnswerKey | null;
  onSave: (key: AnswerKey) => void;
}

const MasterKeySetup: React.FC<MasterKeySetupProps> = ({ masterKey, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<AnswerKey | null>(masterKey);
  const [isEditing, setIsEditing] = useState(!masterKey);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const result = await processAnswerSheet(base64, true);
          
          const newAnswers: Record<number, string> = {};
          result.answers.forEach((a: any) => {
            newAnswers[a.questionNumber] = a.answer.toUpperCase();
          });

          const newKey: AnswerKey = {
            id: Date.now().toString(),
            name: file.name.replace(/\.[^/.]+$/, ""),
            answers: newAnswers,
            totalQuestions: result.answers.length,
            lastUpdated: new Date().toISOString()
          };

          setEditingKey(newKey);
          setIsEditing(true);
        } catch (err) {
          setError("Failed to parse the answer key. Please ensure the image is clear.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error reading file.");
      setLoading(false);
    }
  };

  const saveChanges = () => {
    if (editingKey) {
      onSave(editingKey);
      setIsEditing(false);
    }
  };

  const updateAnswer = (qNum: number, value: string) => {
    if (!editingKey) return;
    setEditingKey({
      ...editingKey,
      answers: { ...editingKey.answers, [qNum]: value.toUpperCase() }
    });
  };

  const addQuestion = () => {
    if (!editingKey) return;
    const nextQ = Math.max(...Object.keys(editingKey.answers).map(Number), 0) + 1;
    setEditingKey({
      ...editingKey,
      answers: { ...editingKey.answers, [nextQ]: 'A' },
      totalQuestions: editingKey.totalQuestions + 1
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Master Answer Key</h2>
            <p className="text-sm text-gray-500">Upload a scan of the correct answers or create one manually.</p>
          </div>
          <div className="flex space-x-2">
            {!isEditing && masterKey && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Edit Key
              </button>
            )}
            {isEditing && (
              <button 
                onClick={saveChanges}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Apply Changes
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
              <p className="text-indigo-600 font-medium italic">Analyzing master key with Gemini AI...</p>
            </div>
          ) : isEditing ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 mb-6">
                <label className="cursor-pointer group text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-600 transition-colors mb-2">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">Upload New Master Scan</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              </div>

              {editingKey && (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
                    {Object.keys(editingKey.answers).sort((a,b) => Number(a)-Number(b)).map((qNum) => (
                      <div key={qNum} className="flex items-center space-x-2 p-2 border rounded bg-white shadow-sm">
                        <span className="text-gray-500 font-bold w-6">{qNum}.</span>
                        <input 
                          type="text" 
                          maxLength={1}
                          value={editingKey.answers[Number(qNum)]}
                          onChange={(e) => updateAnswer(Number(qNum), e.target.value)}
                          className="w-full text-center font-bold border-none focus:ring-0 focus:outline-none uppercase"
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={addQuestion}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-all font-medium flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Add Question
                  </button>
                </div>
              )}
            </div>
          ) : masterKey ? (
            <div className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-indigo-900 font-bold">{masterKey.name}</p>
                  <p className="text-indigo-700 text-sm">{masterKey.totalQuestions} Questions total</p>
                </div>
                <div className="text-right">
                  <p className="text-indigo-700 text-xs uppercase tracking-wider font-semibold">Last Modified</p>
                  <p className="text-indigo-900">{new Date(masterKey.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {Object.keys(masterKey.answers).sort((a,b) => Number(a)-Number(b)).map((qNum) => (
                  <div key={qNum} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                    <span className="text-gray-400 font-bold text-xs">{qNum}.</span>
                    <span className="text-indigo-600 font-extrabold text-lg">{masterKey.answers[Number(qNum)]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-6">No master key defined yet. Please upload a scan or add questions manually.</p>
              <button 
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Create Manually
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterKeySetup;
