import React from 'react';
import { Sparkles, Users, Dices, UserCheck } from 'lucide-react';

export type ActiveTab = 'picker' | 'grouping' | 'roster';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  studentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  studentCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3.5 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Dices className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                  課堂抽籤與自動分組
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    教師專用
                  </span>
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  隨機抽籤動畫音效 • 靈活自動分組 • CSV 與文字匯入
                </p>
              </div>
            </div>

            {/* Quick Student Count Badge on mobile */}
            <button
              type="button"
              onClick={() => onTabChange('roster')}
              className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>{studentCount} 人</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center">
            <nav className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => onTabChange('picker')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'picker'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>隨機抽籤</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('grouping')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'grouping'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>自動分組</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('roster')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'roster'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>名單管理 ({studentCount})</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
