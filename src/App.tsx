/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Student } from './types';
import { Header, ActiveTab } from './components/Header';
import { RandomPicker } from './components/RandomPicker';
import { AutoGrouping } from './components/AutoGrouping';
import { RosterManager } from './components/RosterManager';
import {
  loadSavedStudents,
  saveStudents,
  loadSavedAllowRepeat,
  saveAllowRepeat,
  loadSavedDrawnIds,
  saveDrawnIds,
} from './utils/storage';

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => loadSavedStudents());
  const [allowRepeat, setAllowRepeat] = useState<boolean>(() => loadSavedAllowRepeat());
  const [drawnStudentIds, setDrawnStudentIds] = useState<Set<string>>(() => loadSavedDrawnIds());
  const [activeTab, setActiveTab] = useState<ActiveTab>('picker');

  // Sync to local storage
  useEffect(() => {
    saveStudents(students);
  }, [students]);

  useEffect(() => {
    saveAllowRepeat(allowRepeat);
  }, [allowRepeat]);

  useEffect(() => {
    saveDrawnIds(drawnStudentIds);
  }, [drawnStudentIds]);

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
  };

  const handleToggleAllowRepeat = (val: boolean) => {
    setAllowRepeat(val);
  };

  const handleMarkDrawn = (studentId: string) => {
    setDrawnStudentIds((prev) => {
      const updated = new Set(prev);
      updated.add(studentId);
      return updated;
    });
  };

  const handleResetDrawn = () => {
    setDrawnStudentIds(new Set());
  };

  const handleRestoreStudent = (studentId: string) => {
    setDrawnStudentIds((prev) => {
      const updated = new Set(prev);
      updated.delete(studentId);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        studentCount={students.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            allowRepeat={allowRepeat}
            onToggleAllowRepeat={handleToggleAllowRepeat}
            drawnStudentIds={drawnStudentIds}
            onMarkDrawn={handleMarkDrawn}
            onResetDrawn={handleResetDrawn}
            onRestoreStudent={handleRestoreStudent}
          />
        )}

        {activeTab === 'grouping' && (
          <AutoGrouping students={students} />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={handleUpdateStudents}
            onClearDrawnStatus={handleResetDrawn}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>課堂隨機抽籤與自動分組工具 • 專為教學設計</span>
          <span>資料儲存於本地瀏覽器，安全不外流 • 支援 CSV 匯出匯入</span>
        </div>
      </footer>
    </div>
  );
}
