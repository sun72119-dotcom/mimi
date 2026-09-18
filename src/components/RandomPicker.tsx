import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Student, DrawRecord } from '../types';
import { playTickSound, playFanfareSound } from '../utils/audio';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  History,
  Trash2,
  CheckCircle2,
  Users,
  AlertCircle
} from 'lucide-react';

interface RandomPickerProps {
  students: Student[];
  allowRepeat: boolean;
  onToggleAllowRepeat: (val: boolean) => void;
  drawnStudentIds: Set<string>;
  onMarkDrawn: (studentId: string) => void;
  onResetDrawn: () => void;
  onRestoreStudent: (studentId: string) => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  allowRepeat,
  onToggleAllowRepeat,
  drawnStudentIds,
  onMarkDrawn,
  onResetDrawn,
  onRestoreStudent,
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [displayStudent, setDisplayStudent] = useState<Student | null>(null);
  const [winner, setWinner] = useState<Student | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [history, setHistory] = useState<DrawRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rollTimerRef = useRef<number | null>(null);

  // Available students for drawing
  const availableStudents = allowRepeat
    ? students
    : students.filter((s) => !drawnStudentIds.has(s.id));

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (rollTimerRef.current) {
        window.clearTimeout(rollTimerRef.current);
      }
    };
  }, []);

  // Fire celebratory confetti burst
  const triggerConfetti = () => {
    try {
      // Two-stage confetti
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0.1, y: 0.7 },
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 0.9, y: 0.7 },
        });
      }, 200);
    } catch {
      // Confetti fail safe
    }
  };

  // The core draw animation with decelerating roulette rhythm
  const startDraw = useCallback(() => {
    if (isRolling) return;
    if (availableStudents.length === 0) return;

    setIsRolling(true);
    setWinner(null);

    // Pick a definitive winner beforehand
    const selectedWinner = availableStudents[Math.floor(Math.random() * availableStudents.length)];

    let currentSpeed = 45; // Start fast
    const totalDuration = 2600; // ~2.6 seconds of rolling
    const startTime = Date.now();

    const rollStep = () => {
      const elapsed = Date.now() - startTime;

      // Select a random temporary candidate for the roulette visual
      const randomCandidate = students[Math.floor(Math.random() * students.length)];
      setDisplayStudent(randomCandidate);

      if (soundEnabled) {
        playTickSound(0.25);
      }

      // Check if time is up
      if (elapsed >= totalDuration) {
        // Stop on the final winner
        setDisplayStudent(selectedWinner);
        setWinner(selectedWinner);
        setIsRolling(false);

        // Sound fanfare & confetti
        if (soundEnabled) {
          playFanfareSound(0.35);
        }
        triggerConfetti();

        // Mark as drawn if non-repeat mode
        if (!allowRepeat) {
          onMarkDrawn(selectedWinner.id);
        }

        // Add to history
        setHistory((prev) => [
          {
            id: `rec-${Date.now()}`,
            studentId: selectedWinner.id,
            studentName: selectedWinner.name,
            timestamp: Date.now(),
          },
          ...prev,
        ]);
        return;
      }

      // Deceleration curve: speed slows down smoothly towards the end
      const progress = elapsed / totalDuration;
      if (progress > 0.6) {
        currentSpeed = Math.floor(45 + Math.pow(progress, 3) * 320);
      } else {
        currentSpeed = Math.floor(45 + progress * 40);
      }

      rollTimerRef.current = window.setTimeout(rollStep, currentSpeed);
    };

    rollStep();
  }, [isRolling, availableStudents, students, soundEnabled, allowRepeat, onMarkDrawn]);

  // Spacebar hotkey to trigger draw
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'TEXTAREA' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        startDraw();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startDraw]);

  const handleRestoreLast = (studentId: string) => {
    onRestoreStudent(studentId);
    setHistory((prev) => prev.filter((item) => item.studentId !== studentId));
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-between ${
        isFullscreen ? 'bg-slate-900 text-white min-h-screen p-8 justify-center' : 'space-y-6'
      }`}
    >
      {/* Settings Bar */}
      <div
        className={`w-full flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border ${
          isFullscreen
            ? 'bg-slate-800/80 border-slate-700 text-white'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        {/* Left: Mode Selection */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">抽籤模式</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
            <button
              type="button"
              onClick={() => onToggleAllowRepeat(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                !allowRepeat
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              不重複抽取
            </button>
            <button
              type="button"
              onClick={() => onToggleAllowRepeat(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                allowRepeat
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              允許重複抽取
            </button>
          </div>

          {!allowRepeat && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                待抽: {availableStudents.length} 人
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                已抽: {drawnStudentIds.size} 人
              </span>
            </div>
          )}
        </div>

        {/* Right: Controls (Sound, Fullscreen, Reset, History) */}
        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            title={soundEnabled ? '點擊關閉音效' : '點擊開啟音效'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? '音效開啟' : '靜音'}</span>
          </button>

          {/* Reset Pool (when non-repeat has items) */}
          {!allowRepeat && drawnStudentIds.size > 0 && (
            <button
              type="button"
              onClick={onResetDrawn}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
              title="重置已抽籤名單"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置籤池</span>
            </button>
          )}

          {/* Draw History toggle */}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              showHistory
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="查看本次抽籤歷史"
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">紀錄 ({history.length})</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
            title={isFullscreen ? '退出全螢幕' : '投影全螢幕大字模式'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isFullscreen ? '縮小' : '全螢幕投影'}</span>
          </button>
        </div>
      </div>

      {/* Main Drawing Stage / Card */}
      <div
        className={`w-full relative overflow-hidden rounded-2xl border transition-all ${
          isFullscreen
            ? 'max-w-4xl bg-slate-800 border-slate-700 shadow-2xl p-10 my-auto'
            : 'bg-white border-slate-200 shadow-sm p-8 sm:p-12'
        }`}
      >
        {/* Subtle decorative background gradients */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Status Label */}
          <div className="mb-4">
            {isRolling ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                正在隨機抽選中...
              </span>
            ) : winner ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                幸運抽中！
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                準備就緒
              </span>
            )}
          </div>

          {/* The Big Stage Display */}
          <div
            className={`w-full max-w-lg min-h-[220px] sm:min-h-[260px] flex flex-col items-center justify-center rounded-2xl p-6 transition-all duration-300 ${
              isRolling
                ? 'border-2 border-blue-400 bg-blue-50/50 shadow-inner'
                : winner
                ? 'border-2 border-emerald-400 bg-emerald-50/40 shadow-lg ring-4 ring-emerald-100'
                : 'border-2 border-dashed border-slate-200 bg-slate-50/60'
            }`}
          >
            <AnimatePresence mode="wait">
              {displayStudent ? (
                <motion.div
                  key={isRolling ? displayStudent.id + '-' + Math.random() : displayStudent.id}
                  initial={{ scale: isRolling ? 0.95 : 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: isRolling ? 1.05 : 0.9, opacity: 0 }}
                  transition={{ duration: isRolling ? 0.06 : 0.25, ease: 'easeOut' }}
                  className="flex flex-col items-center"
                >
                  {displayStudent.seatNumber && (
                    <span
                      className={`text-sm sm:text-base font-bold tracking-widest px-3 py-1 rounded-full mb-3 ${
                        winner
                          ? 'bg-emerald-600 text-white'
                          : isRolling
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      座號 {displayStudent.seatNumber}
                    </span>
                  )}
                  <h1
                    className={`font-black tracking-tight transition-colors ${
                      isFullscreen
                        ? 'text-6xl sm:text-8xl text-white'
                        : winner
                        ? 'text-5xl sm:text-7xl text-slate-900'
                        : isRolling
                        ? 'text-4xl sm:text-6xl text-blue-600'
                        : 'text-4xl sm:text-6xl text-slate-800'
                    }`}
                  >
                    {displayStudent.name}
                  </h1>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Sparkles className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="text-lg font-medium text-slate-500">點擊下方按鈕或按空白鍵開始抽籤</p>
                  <p className="text-xs text-slate-400 mt-1">目前名單共有 {students.length} 位學生</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Button & Help */}
          <div className="mt-8 flex flex-col items-center gap-3">
            {students.length === 0 ? (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2.5 rounded-lg border border-amber-200 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>請先至「名單管理」分頁上傳 CSV 或貼上學生姓名</span>
              </div>
            ) : !allowRepeat && availableStudents.length === 0 ? (
              <div className="flex flex-col items-center gap-2">
                <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-lg">
                  所有學生已全數抽出完畢！
                </div>
                <button
                  type="button"
                  onClick={onResetDrawn}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  重新洗牌籤池
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startDraw}
                disabled={isRolling}
                className={`px-8 py-3.5 rounded-xl font-black text-base tracking-wide text-white shadow-lg transition-all transform cursor-pointer ${
                  isRolling
                    ? 'bg-slate-400 cursor-not-allowed scale-95'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-95'
                }`}
              >
                {isRolling ? '抽籤進行中...' : '🎲 開始抽籤 (Space)'}
              </button>
            )}

            <span className="text-xs text-slate-400">
              提示：可直接按鍵盤 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono text-slate-600">Space</kbd> 空白鍵進行抽籤
            </span>
          </div>
        </div>
      </div>

      {/* Non-Repeat Mode Stats & Remaining Students Grid */}
      {!allowRepeat && students.length > 0 && !isFullscreen && (
        <div className="w-full bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">抽籤池進度</h3>
              <span className="text-xs text-slate-500">
                （待抽 {availableStudents.length} 人 / 已抽 {drawnStudentIds.size} 人）
              </span>
            </div>
            {drawnStudentIds.size > 0 && (
              <button
                type="button"
                onClick={onResetDrawn}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                重設為全體未抽
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {students.map((st) => {
              const isDrawn = drawnStudentIds.has(st.id);
              return (
                <span
                  key={st.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    isDrawn
                      ? 'bg-slate-100 text-slate-400 line-through opacity-60'
                      : 'bg-blue-50 text-blue-800 border border-blue-200/80 shadow-xs'
                  }`}
                >
                  {st.seatNumber && <span className="opacity-70 text-[10px]">{st.seatNumber}.</span>}
                  {st.name}
                  {isDrawn && (
                    <button
                      type="button"
                      onClick={() => handleRestoreLast(st.id)}
                      className="ml-1 text-slate-400 hover:text-blue-600 cursor-pointer no-underline"
                      title="放回籤池"
                    >
                      ↩
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Draw History Drawer / Modal */}
      {showHistory && (
        <div className="w-full bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">抽籤紀錄</h3>
              <span className="text-xs text-slate-500">共 {history.length} 次抽取</span>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                清除紀錄
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">目前尚無抽籤紀錄</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {history.map((record, index) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <span className="text-slate-400 font-mono text-[10px]">#{history.length - index}</span>
                  <span className="font-semibold text-slate-800 truncate px-1.5">{record.studentName}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
