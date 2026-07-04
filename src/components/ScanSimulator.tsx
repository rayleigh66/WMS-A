/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QrCode, Scan, X, Sparkles, Database, Check } from 'lucide-react';
import { Material, Location, WmsDocument } from '../types';

interface ScanSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedValue: string, type: 'material' | 'location' | 'batch' | 'document' | 'unknown') => void;
  title?: string;
  expectedType?: 'material' | 'location' | 'batch' | 'document' | 'all';
  materialsList: Material[];
  locationsList: Location[];
  documentsList: WmsDocument[];
}

export default function ScanSimulator({
  isOpen,
  onClose,
  onScanSuccess,
  title = "条码/二维码扫码模拟器",
  expectedType = 'all',
  materialsList,
  locationsList,
  documentsList
}: ScanSimulatorProps) {
  const [manualCode, setManualCode] = useState('');
  const [activeTab, setActiveTab] = useState<'preset' | 'manual'>('preset');

  if (!isOpen) return null;

  // Predetermined batches
  const presetBatches = [
    'BATCH-2026-0610',
    'BATCH-2026-0615',
    'BATCH-2026-0601',
    'BATCH-2026-0602',
    'BATCH-2026-0605',
    'BATCH-2026-0620'
  ];

  const handleSelectPreset = (value: string, detectedType: 'material' | 'location' | 'batch' | 'document') => {
    onScanSuccess(value, detectedType);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    let detectedType: 'material' | 'location' | 'batch' | 'document' | 'unknown' = 'unknown';
    const val = manualCode.trim();

    if (materialsList.some(m => m.material_code === val)) {
      detectedType = 'material';
    } else if (locationsList.some(l => l.location_code === val || l.barcode === val)) {
      detectedType = 'location';
    } else if (val.startsWith('BATCH-')) {
      detectedType = 'batch';
    } else if (documentsList.some(d => d.document_no === val)) {
      detectedType = 'document';
    }

    onScanSuccess(val, detectedType);
    setManualCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 text-white shadow-2xl transition-all">
        {/* Camera Visual Top Panel */}
        <div className="bg-slate-950 p-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-sm tracking-wide text-slate-200">{title}</span>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera simulation viewport */}
        <div className="relative h-44 bg-slate-950 flex flex-col justify-center items-center overflow-hidden border-b border-slate-800">
          {/* Scanning box */}
          <div className="relative w-48 h-28 border border-emerald-500/45 rounded-lg flex flex-col justify-between p-2">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-0.5 -ml-0.5 rounded-tl-sm"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-0.5 -mr-0.5 rounded-tr-sm"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-0.5 -ml-0.5 rounded-bl-sm"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-0.5 -mr-0.5 rounded-br-sm"></div>
            
            {/* Laser line animation */}
            <div className="w-full h-[2px] bg-emerald-400/90 shadow-[0_0_10px_#10b981] animate-bounce my-auto"></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            模拟器摄像头已就绪：请点击下方选项模拟扫码
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex border-b border-slate-800 text-xs bg-slate-900/60 font-medium">
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              activeTab === 'preset' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            常用扫码预设
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              activeTab === 'manual' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            手动输入条码
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 max-h-72 overflow-y-auto bg-slate-900">
          {activeTab === 'preset' ? (
            <div className="space-y-4">
              {/* Materials presets */}
              {(expectedType === 'all' || expectedType === 'material') && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> 模拟扫描「物料二维码」
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {materialsList.map(m => (
                      <button
                        key={m.material_code}
                        onClick={() => handleSelectPreset(m.material_code, 'material')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-left text-xs font-mono transition-colors text-slate-100 flex flex-col hover:border-emerald-500/50 border border-transparent"
                      >
                        <span className="font-semibold text-emerald-400 truncate">{m.material_code}</span>
                        <span className="text-[10px] text-slate-400 truncate">{m.material_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Location presets */}
              {(expectedType === 'all' || expectedType === 'location') && (
                <div className="mt-4">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 模拟扫描「库位二维码」
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {locationsList.map(l => (
                      <button
                        key={l.location_code}
                        onClick={() => handleSelectPreset(l.location_code, 'location')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-left text-xs font-mono transition-colors text-slate-100 flex flex-col hover:border-emerald-500/50 border border-transparent"
                      >
                        <span className="font-semibold text-amber-400">{l.location_code}</span>
                        <span className="text-[10px] text-slate-400 truncate">{l.location_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Batch presets */}
              {(expectedType === 'all' || expectedType === 'batch') && (
                <div className="mt-4">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> 模拟扫描「批次二维码」
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {presetBatches.map(b => (
                      <button
                        key={b}
                        onClick={() => handleSelectPreset(b, 'batch')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-[11px] font-mono transition-colors text-purple-300 border border-purple-500/20 hover:border-emerald-400"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Document presets */}
              {(expectedType === 'all' || expectedType === 'document') && (
                <div className="mt-4">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> 模拟扫描「单据二维码」
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {documentsList.map(d => (
                      <button
                        key={d.document_no}
                        onClick={() => handleSelectPreset(d.document_no, 'document')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-left text-xs font-mono transition-colors text-slate-100 flex flex-col hover:border-emerald-500/50 border border-transparent"
                      >
                        <span className="font-semibold text-blue-400 truncate">{d.document_no}</span>
                        <span className="text-[10px] text-slate-400 truncate">{d.document_type} • {d.sub_type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">输入物料条码/库位码/批次号/单据号</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="例如: FAB-210D-BK 或 A01-01-01"
                    className="flex-1 bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-500 font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 transition-colors text-white text-xs font-semibold px-4 rounded-lg flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> 确定
                  </button>
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] leading-relaxed text-slate-400">
                <p className="font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  后续 PostgreSQL 集成说明：
                </p>
                在正式连接数据库后，此处的条码会对应到 PostgreSQL 的主键索引。WMS 扫码服务将通过 RESTful API 直接查询后台的 <code>materials</code>、<code>locations</code> 以及 <code>documents</code> 关联表，达到毫秒级的实物数据映射。
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-950 p-3 text-center text-[10px] text-slate-500 border-t border-slate-800">
          Factory WMS 极简扫码终端框架 • 无缝过渡物理 PDA 扫码枪设备
        </div>
      </div>
    </div>
  );
}
