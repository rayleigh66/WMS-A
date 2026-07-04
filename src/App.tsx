/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WmsProvider } from './context/WmsContext';
import DesktopApp from './components/DesktopApp';
import MobileApp from './components/MobileApp';
import { Laptop, Smartphone, HelpCircle, GitCommit, Database, ArrowRightLeft } from 'lucide-react';

export default function App() {
  // Toggle between PC 'desktop' view and Phone 'mobile' view
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <WmsProvider>
      <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
        
        {/* WMS Quick Interactive Device Header (Only visible in prototype for easy demonstration) */}
        <header className="bg-[#1a3a3a] border-b border-[#0f2424] py-3 px-6 shrink-0 z-40 relative shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
            
            {/* Branding */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="font-extrabold text-xs text-white uppercase tracking-widest">Factory WMS Prototype</span>
                <span className="block text-[10px] text-emerald-200/80 font-medium mt-0.5">背包工厂独立仓储原型验证系统 • 流水驱动存货模型</span>
              </div>
            </div>

            {/* Quick Mode Toggle Buttons */}
            <div className="flex items-center bg-[#132b2b] p-1 rounded-xl border border-emerald-900/40">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  deviceMode === 'desktop'
                    ? 'bg-emerald-600 text-white shadow shadow-emerald-950/40'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>🖥️ 电脑端后台管理</span>
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  deviceMode === 'mobile'
                    ? 'bg-emerald-600 text-white shadow shadow-emerald-950/40'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>📱 手机端现场扫码</span>
              </button>
            </div>

            {/* Interactive workflow hint */}
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-emerald-100 bg-[#132b2b]/50 py-1 px-2.5 rounded-lg border border-emerald-900/40">
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span><b>实时对账验证提示：</b>可在“手机端”扫码出入库或盘点，再切回“电脑端”见证存货表和流水实时核算！</span>
            </div>

          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto flex flex-col justify-center">
          {deviceMode === 'desktop' ? (
            /* Render Desktop WMS Control System */
            <div className="flex-1 flex flex-col justify-center min-h-[600px]">
              <DesktopApp />
            </div>
          ) : (
            /* Render Mobile Phone PDA Device wrapped in a beautiful CSS smartphone bezel mockup */
            <div className="flex-1 flex justify-center items-center py-4">
              
              {/* Smartphone Mockup */}
              <div className="relative mx-auto border-[12px] border-gray-800 bg-white rounded-[40px] shadow-2xl w-full max-w-[380px] h-[720px] flex flex-col overflow-hidden ring-1 ring-gray-200">
                {/* Speaker Grill / Dynamic Notch */}
                <div className="absolute top-0 inset-x-0 h-5 bg-gray-800 rounded-b-xl z-50 flex items-center justify-center">
                  <div className="w-16 h-1.5 bg-gray-900 rounded-full"></div>
                </div>

                {/* Simulated Screen Body */}
                <div className="flex-1 flex flex-col bg-gray-50 pt-5 text-gray-900 overflow-hidden relative">
                  <MobileApp />
                </div>

                {/* Home Indicator line */}
                <div className="absolute bottom-1 inset-x-0 h-1 flex items-center justify-center z-50 pointer-events-none">
                  <div className="w-28 h-1 bg-gray-300 rounded-full"></div>
                </div>
              </div>

            </div>
          )}
        </main>

        {/* Footer info */}
        <footer className="bg-white border-t border-gray-200 py-3 text-center text-[10px] text-gray-400 tracking-wide">
          Factory WMS © 2026 背包制造工厂独立智能仓储原型系统. 基于 PostgreSQL 流水账约束规范.
        </footer>

      </div>
    </WmsProvider>
  );
}
