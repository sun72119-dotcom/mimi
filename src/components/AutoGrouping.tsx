import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, StudentGroup, GroupingMethod, RemainderHandling } from '../types';
import { playShuffleSound } from '../utils/audio';
import {
  Users,
  Shuffle,
  Copy,
  Download,
  Check,
  AlertCircle,
  Settings2,
  Crown
} from 'lucide-react';

interface AutoGroupingProps {
  students: Student[];
}

// Visual color themes for groups
const GROUP_THEMES = [
  { bg: 'bg-blue-50/70', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-600', chip: 'bg-blue-100/70 text-blue-900 border-blue-200' },
  { bg: 'bg-emerald-50/70', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-600', chip: 'bg-emerald-100/70 text-emerald-900 border-emerald-200' },
  { bg: 'bg-amber-50/70', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-600', chip: 'bg-amber-100/70 text-amber-900 border-amber-200' },
  { bg: 'bg-purple-50/70', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-600', chip: 'bg-purple-100/70 text-purple-900 border-purple-200' },
  { bg: 'bg-rose-50/70', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-600', chip: 'bg-rose-100/70 text-rose-900 border-rose-200' },
  { bg: 'bg-cyan-50/70', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-600', chip: 'bg-cyan-100/70 text-cyan-900 border-cyan-200' },
  { bg: 'bg-indigo-50/70', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-600', chip: 'bg-indigo-100/70 text-indigo-900 border-indigo-200' },
  { bg: 'bg-teal-50/70', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-600', chip: 'bg-teal-100/70 text-teal-900 border-teal-200' },
  { bg: 'bg-orange-50/70', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-600', chip: 'bg-orange-100/70 text-orange-900 border-orange-200' },
  { bg: 'bg-fuchsia-50/70', border: 'border-fuchsia-200', text: 'text-fuchsia-700', badge: 'bg-fuchsia-600', chip: 'bg-fuchsia-100/70 text-fuchsia-900 border-fuchsia-200' },
];

export const AutoGrouping: React.FC<AutoGroupingProps> = ({ students }) => {
  const [method, setMethod] = useState<GroupingMethod>('byMembers');
  const [groupSize, setGroupSize] = useState<number>(4); // 每組幾人
  const [groupCount, setGroupCount] = useState<number>(6); // 分成幾組
  const [remainderHandling, setRemainderHandling] = useState<RemainderHandling>('distribute');
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [copied, setCopied] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [leaders, setLeaders] = useState<Record<string, string>>({}); // groupId -> studentId

  // Perform grouping logic
  const handleGroupStudents = () => {
    if (students.length === 0) return;

    setAnimating(true);
    playShuffleSound(0.25);

    // Shuffle student list using Fisher-Yates algorithm
    const pool = [...students];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    let calculatedGroups: StudentGroup[] = [];

    if (method === 'byMembers') {
      const targetSize = Math.max(1, groupSize);
      if (remainderHandling === 'separate') {
        // Simple chunking into targetSize, last group contains the remainder
        let groupIdx = 0;
        for (let i = 0; i < pool.length; i += targetSize) {
          const chunk = pool.slice(i, i + targetSize);
          const theme = GROUP_THEMES[groupIdx % GROUP_THEMES.length];
          calculatedGroups.push({
            id: `grp-${groupIdx + 1}`,
            name: `第 ${groupIdx + 1} 組`,
            color: theme.text,
            members: chunk,
          });
          groupIdx++;
        }
      } else {
        // Distribute remainder evenly across groups
        const numGroups = Math.max(1, Math.floor(pool.length / targetSize));
        const newGroups: StudentGroup[] = Array.from({ length: numGroups }, (_, idx) => ({
          id: `grp-${idx + 1}`,
          name: `第 ${idx + 1} 組`,
          color: GROUP_THEMES[idx % GROUP_THEMES.length].text,
          members: [],
        }));

        pool.forEach((student, idx) => {
          const targetGroupIdx = idx % numGroups;
          newGroups[targetGroupIdx].members.push(student);
        });
        calculatedGroups = newGroups;
      }
    } else {
      // By total group count
      const numGroups = Math.max(1, Math.min(groupCount, pool.length));
      const newGroups: StudentGroup[] = Array.from({ length: numGroups }, (_, idx) => ({
        id: `grp-${idx + 1}`,
        name: `第 ${idx + 1} 組`,
        color: GROUP_THEMES[idx % GROUP_THEMES.length].text,
        members: [],
      }));

      pool.forEach((student, idx) => {
        const targetGroupIdx = idx % numGroups;
        newGroups[targetGroupIdx].members.push(student);
      });
      calculatedGroups = newGroups;
    }

    setTimeout(() => {
      setGroups(calculatedGroups);
      setLeaders({});
      setAnimating(false);
    }, 250);
  };

  // Group on initial load if students exist and groups not yet formed
  useEffect(() => {
    if (students.length > 0 && groups.length === 0) {
      handleGroupStudents();
    }
  }, [students.length]);

  // Copy result text to clipboard
  const handleCopyGroups = () => {
    if (groups.length === 0) return;

    const lines: string[] = ['【班級自動分組結果】', `總人數：${students.length} 人，共分成 ${groups.length} 組\n`];

    groups.forEach((grp) => {
      const memberNames = grp.members
        .map((m) => {
          const isLeader = leaders[grp.id] === m.id;
          const seat = m.seatNumber ? `(${m.seatNumber})` : '';
          return `${m.name}${seat}${isLeader ? ' ★組長' : ''}`;
        })
        .join('、');
      lines.push(`${grp.name} (${grp.members.length}人)：${memberNames}`);
    });

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Export as TXT / CSV file
  const handleExportGroups = () => {
    if (groups.length === 0) return;

    let csvContent = '\uFEFF組別,組長,座號,姓名\r\n';
    groups.forEach((grp) => {
      grp.members.forEach((m) => {
        const isLeader = leaders[grp.id] === m.id ? '是' : '';
        csvContent += `"${grp.name}","${isLeader}","${m.seatNumber || ''}","${m.name}"\r\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `學生分組結果_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Toggle group leader
  const handleToggleLeader = (groupId: string, studentId: string) => {
    setLeaders((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === studentId ? '' : studentId,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Grouping Configuration Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              學生自動分組
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              設定每組人數或總組數，一鍵隨機分組並視覺化呈現。
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleGroupStudents}
              disabled={students.length === 0 || animating}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Shuffle className={`w-4 h-4 ${animating ? 'animate-spin' : ''}`} />
              {groups.length > 0 ? '重新隨機分組' : '開始隨機分組'}
            </button>

            {groups.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleCopyGroups}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-slate-200"
                  title="複製分組名單到剪貼簿"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '已複製！' : '複製文字'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportGroups}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-slate-200"
                  title="匯出分組 CSV 表格"
                >
                  <Download className="w-4 h-4" />
                  <span>下載分組表</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Controls Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Method Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-blue-600" />
              分組方式
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setMethod('byMembers')}
                className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  method === 'byMembers'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                依每組人數
              </button>
              <button
                type="button"
                onClick={() => setMethod('byGroupCount')}
                className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  method === 'byGroupCount'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                依總共組數
              </button>
            </div>
          </div>

          {/* Number selector */}
          {method === 'byMembers' ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">設定每組幾人</label>
                <span className="text-xs font-bold text-blue-600">{groupSize} 人 / 組</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={2}
                  max={Math.max(2, Math.min(12, students.length || 10))}
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <input
                  type="number"
                  min={2}
                  max={students.length || 20}
                  value={groupSize}
                  onChange={(e) => setGroupSize(Math.max(2, Number(e.target.value)))}
                  className="w-14 text-xs font-bold px-2 py-1 border border-slate-300 rounded-md text-center"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">設定總共分幾組</label>
                <span className="text-xs font-bold text-blue-600">{groupCount} 組</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={2}
                  max={Math.max(2, Math.min(12, students.length || 10))}
                  value={groupCount}
                  onChange={(e) => setGroupCount(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <input
                  type="number"
                  min={2}
                  max={students.length || 20}
                  value={groupCount}
                  onChange={(e) => setGroupCount(Math.max(2, Number(e.target.value)))}
                  className="w-14 text-xs font-bold px-2 py-1 border border-slate-300 rounded-md text-center"
                />
              </div>
            </div>
          )}

          {/* Remainder strategy (for byMembers) */}
          {method === 'byMembers' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">剩餘人數處理方式</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setRemainderHandling('distribute')}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    remainderHandling === 'distribute'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  平均分散至各組
                </button>
                <button
                  type="button"
                  onClick={() => setRemainderHandling('separate')}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    remainderHandling === 'separate'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  獨立成一組
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grouping Visual Result */}
      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-700">尚未匯入學生名單</p>
          <p className="text-xs text-slate-400 mt-1">請先至「名單管理」上傳 CSV 或貼上學生姓名</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <Users className="w-10 h-10 text-blue-300 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-700">準備就緒，點擊上方按鈕開始分組</p>
          <p className="text-xs text-slate-400 mt-1">目前學生總數：{students.length} 人</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-500">
              分組結果：全體 {students.length} 位學生，已平均分配至 {groups.length} 組
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              點擊學生名牌右側皇冠可指定為「組長」
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {groups.map((grp, gIdx) => {
                const theme = GROUP_THEMES[gIdx % GROUP_THEMES.length];
                const leaderId = leaders[grp.id];

                return (
                  <motion.div
                    key={grp.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: gIdx * 0.04 }}
                    className={`rounded-xl border ${theme.border} ${theme.bg} p-4 shadow-xs flex flex-col justify-between`}
                  >
                    <div>
                      {/* Group Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${theme.badge}`} />
                          <h3 className="font-bold text-slate-800 text-sm">{grp.name}</h3>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200/80 text-slate-600 shadow-xs">
                          {grp.members.length} 人
                        </span>
                      </div>

                      {/* Group Member Chips */}
                      <div className="space-y-2">
                        {grp.members.map((member) => {
                          const isLeader = leaderId === member.id;
                          return (
                            <div
                              key={member.id}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                                isLeader
                                  ? 'bg-amber-100/90 border border-amber-300 text-amber-900 shadow-xs'
                                  : 'bg-white/90 hover:bg-white border border-slate-200/70 text-slate-800 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {member.seatNumber && (
                                  <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                                    {member.seatNumber}
                                  </span>
                                )}
                                <span className="font-semibold truncate">{member.name}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleLeader(grp.id, member.id)}
                                className={`p-1 rounded cursor-pointer transition-colors ${
                                  isLeader
                                    ? 'text-amber-600 hover:text-amber-800'
                                    : 'text-slate-300 hover:text-amber-500'
                                }`}
                                title={isLeader ? '取消組長' : '指定為組長'}
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Group Footer Leader Summary */}
                    {leaderId && (
                      <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center gap-1.5 text-[11px] text-amber-800 font-semibold">
                        <Crown className="w-3 h-3 text-amber-600" />
                        <span>組長：{grp.members.find((m) => m.id === leaderId)?.name}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
