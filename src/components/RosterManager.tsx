import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { parseCSVContent, parsePastedNames, SAMPLE_STUDENTS, exportToCSV } from '../utils/csv';
import {
  Upload,
  ClipboardList,
  UserPlus,
  Trash2,
  Download,
  Users,
  CheckCircle2,
  Sparkles,
  FileText
} from 'lucide-react';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onClearDrawnStatus: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
  onClearDrawnStatus,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleSeat, setSingleSeat] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'manual'>('upload');
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseCSVContent(text);
        if (parsed.length > 0) {
          onUpdateStudents(parsed);
          onClearDrawnStatus();
          showToast(`成功匯入 ${parsed.length} 位學生！`);
        } else {
          showToast('無法從 CSV 解析出學生名單，請確認格式');
        }
      } catch {
        showToast('檔案讀取失敗，請確認檔案格式');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handlePasteSubmit = () => {
    const parsed = parsePastedNames(pasteText);
    if (parsed.length > 0) {
      onUpdateStudents(parsed);
      onClearDrawnStatus();
      setPasteText('');
      showToast(`成功匯入 ${parsed.length} 位學生！`);
    } else {
      showToast('請輸入或貼上至少一位學生姓名');
    }
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;

    const newStudent: Student = {
      id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: singleName.trim(),
      seatNumber: singleSeat.trim() || String(students.length + 1).padStart(2, '0'),
    };

    onUpdateStudents([...students, newStudent]);
    setSingleName('');
    setSingleSeat('');
    showToast(`已新增學生：${newStudent.name}`);
  };

  const handleDelete = (id: string) => {
    const updated = students.filter((s) => s.id !== id);
    onUpdateStudents(updated);
  };

  const handleClearAll = () => {
    if (confirm('確定要清空目前的名單嗎？')) {
      onUpdateStudents([]);
      onClearDrawnStatus();
      showToast('已清空學生名單');
    }
  };

  const handleLoadSample = () => {
    onUpdateStudents(SAMPLE_STUDENTS);
    onClearDrawnStatus();
    showToast(`已載入範例名單（共 ${SAMPLE_STUDENTS.length} 位學生）`);
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const csvData = exportToCSV(students);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `班級學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('已下載名單 CSV');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium transition-all">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner & Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              學生名單來源管理
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              可上傳 CSV 檔案、整批貼上姓名、或單筆新增，系統會妥善保存名單供抽籤與分組使用。
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              載入示範名單 (24人)
            </button>
            {students.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="匯出為 CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  匯出
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                  title="清空全體名單"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  清空
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation for Roster Input Modes */}
        <div className="mt-5 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            上傳 CSV 檔案
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            貼上文字名單
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            個別新增
          </button>
        </div>

        {/* Tab 1: CSV Upload */}
        {activeTab === 'upload' && (
          <div className="mt-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl p-8 text-center cursor-pointer transition-colors group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                點擊此處選取 CSV 檔案 或 拖曳檔案至此
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
                支援格式：包含「姓名」欄位，或直接每行填寫姓名。可含「座號」欄位，支援 UTF-8 編碼。
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>
                範例格式：每行一個學生姓名，或「01,陳建宏」、「02,林郁婷」
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Paste Names */}
        {activeTab === 'paste' && (
          <div className="mt-5 space-y-3">
            <label className="block text-xs font-semibold text-slate-600">
              請在此貼上學生姓名（每行一個，亦可用逗號或空格分隔）：
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="例如：&#10;01 陳建宏&#10;02 林郁婷&#10;黃冠宇&#10;張雅雯&#10;李宗翰"
              rows={5}
              className="w-full text-sm p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">
                貼上後點擊下方按鈕即可建立名單
              </span>
              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                匯入名單
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Manual Add */}
        {activeTab === 'manual' && (
          <form onSubmit={handleAddSingle} className="mt-5 flex flex-wrap gap-3 items-end">
            <div className="w-24">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                座號 (選填)
              </label>
              <input
                type="text"
                value={singleSeat}
                onChange={(e) => setSingleSeat(e.target.value)}
                placeholder="01"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                學生姓名 *
              </label>
              <input
                type="text"
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                placeholder="輸入姓名"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg h-[38px] cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              新增學生
            </button>
          </form>
        )}
      </div>

      {/* Roster Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">現有名單列表</span>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
              共 {students.length} 位
            </span>
          </div>
          {students.length > 0 && (
            <span className="text-xs text-slate-500">
              點擊垃圾桶可單獨移除學生
            </span>
          )}
        </div>

        {students.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
            <p className="text-sm font-medium text-slate-600">目前名單中尚無學生</p>
            <p className="text-xs text-slate-400 mt-1">
              請從上方上傳 CSV、貼上姓名、或點擊「載入示範名單」快速體驗
            </p>
            <button
              type="button"
              onClick={handleLoadSample}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              立即載入 24 人示範名單
            </button>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 p-4">
              {students.map((student, idx) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-md bg-slate-200/80 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {student.seatNumber || String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {student.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(student.id)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded cursor-pointer"
                    title="刪除此學生"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
