import React from 'react';
import { FileText, Cpu, Terminal, BookOpen, Layers, ShieldCheck, Zap } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'playground' | 'evals' | 'setup' | 'schemas';
  onTabChange: (tab: 'studio' | 'playground' | 'evals' | 'setup' | 'schemas') => void;
  toolCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, toolCount }) => {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">
                  PDF Agent Toolkit
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  MCP Server
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Privacy-first PDF engine for AI Agents • Inspired by ihatepdf.cv
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            <button
              id="tab-btn-studio"
              onClick={() => onTabChange('studio')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'studio'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Tools Studio</span>
            </button>

            <button
              id="tab-btn-playground"
              onClick={() => onTabChange('playground')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'playground'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>Agent Playground</span>
            </button>

            <button
              id="tab-btn-evals"
              onClick={() => onTabChange('evals')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'evals'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Eval Suite</span>
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                14
              </span>
            </button>

            <button
              id="tab-btn-setup"
              onClick={() => onTabChange('setup')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'setup'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Terminal className="w-4 h-4 text-violet-600" />
              <span>Quick Setup</span>
            </button>

            <button
              id="tab-btn-schemas"
              onClick={() => onTabChange('schemas')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'schemas'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>MCP Schemas ({toolCount})</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
