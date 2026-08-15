import React from 'react';
import { Loader2 } from 'lucide-react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. COMMERCIAL INTELLIGENCE HEADER SKELETON */}
      <div className="space-y-4">
        {/* Protection Status Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* BK square */}
            <div className="w-12 h-12 rounded-xl bg-slate-800 animate-pulse shrink-0 flex items-center justify-center font-medium text-slate-700 dark:text-slate-300 text-xs">
              BK
            </div>
            <div className="space-y-2 flex-1 md:flex-initial">
              {/* Category label skeleton */}
              <div className="h-2.5 w-32 bg-slate-800 rounded-full animate-pulse" />
              {/* Protection date label skeleton */}
              <div className="h-2 w-44 bg-slate-800/60 rounded-full animate-pulse" />
            </div>
          </div>
          {/* Snapshot button skeleton */}
          <div className="h-10 w-full md:w-36 bg-slate-800 rounded-xl animate-pulse shrink-0" />
        </div>

        {/* Commercial Insights Grid (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 h-[140px] flex flex-col justify-between shadow-xs animate-pulse"
            >
              <div className="space-y-3">
                {/* Badge & Title Row */}
                <div className="flex items-center gap-2">
                  <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded-full" />
                  <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
                {/* Body skeleton lines */}
                <div className="space-y-1.5">
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
                  <div className="h-2.5 w-11/12 bg-slate-100 dark:bg-slate-800 rounded-full" />
                </div>
              </div>
              {/* Action/Metric skeleton at bottom */}
              <div className="h-2 w-16 bg-slate-100 dark:bg-slate-850 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. SUB-HEADER TABS SKELETON */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 animate-pulse">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* 3. METRIC CARDS SKELETON */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
        
        {/* Total Base Card (Dark background matches active MetricCards design) */}
        <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-elegant border border-slate-800 flex flex-col justify-between min-h-[220px] animate-pulse">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-24 bg-slate-800 rounded-full" />
              <div className="h-4 w-12 bg-slate-800 rounded-full" />
            </div>
            <div className="flex items-baseline gap-3">
              <div className="h-12 w-28 bg-slate-800 rounded-xl" />
              <div className="h-3 w-10 bg-slate-800 rounded-full" />
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
            <div className="h-2 w-20 bg-slate-800 rounded-full" />
            <div className="h-2 w-16 bg-slate-800 rounded-full" />
          </div>
        </div>

        {/* Conversão / Performance (Light Card) */}
        <div className="glass-panel shadow-elegant text-slate-900 dark:text-white rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between min-h-[220px] animate-pulse">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="flex items-baseline gap-3">
              <div className="h-12 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full w-full" />
            <div className="flex justify-between">
              <div className="h-2 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="h-2 w-10 bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
          </div>
        </div>

        {/* Varreduras Web (Light Card) */}
        <div className="glass-panel shadow-elegant text-slate-900 dark:text-white rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between min-h-[220px] animate-pulse">
          <div className="space-y-4">
            <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="flex items-baseline gap-3">
              <div className="h-12 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          </div>
          <div className="mt-8 border-t border-slate-50 dark:border-slate-800 pt-6">
            <div className="h-2 w-28 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
        </div>

        {/* Cache IA (Light Card) */}
        <div className="glass-panel shadow-elegant text-slate-900 dark:text-white rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between min-h-[220px] animate-pulse">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="flex items-baseline gap-3">
              <div className="h-12 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-3 w-8 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          </div>
          <div className="mt-8 border-t border-slate-50 dark:border-slate-800 pt-6">
            <div className="h-2 w-32 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
        </div>

      </div>

      {/* 4. LOOP CONTROLLER (ROBOT CONTROLLER) SKELETON */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 md:p-10 shadow-xs flex flex-col md:flex-row gap-8 min-h-[380px] animate-pulse">
        {/* Left Side: Controller Controls */}
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-3.5 w-80 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="h-11 w-36 bg-blue-600/30 rounded-xl" />
            <div className="h-11 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-11 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="h-5 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="h-5 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Side: Map & Location Target list */}
        <div className="w-full md:w-[350px] bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="grid grid-cols-4 gap-2">
              {Array(12).fill(0).map((_, idx) => (
                <div key={idx} className="h-6 bg-slate-100 dark:bg-slate-850 rounded-lg" />
              ))}
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-4 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      </div>

      {/* 5. LOADER SPINNER OVERLAY FOOTNOTE FOR PERCEIVED FIDELITY */}
      <div className="flex items-center justify-center gap-2 text-slate-400 text-xs py-4">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
        <span className="font-semibold tracking-wide text-xs">Sincronizando Banco de Dados e Parâmetros IA...</span>
      </div>

    </div>
  );
};
