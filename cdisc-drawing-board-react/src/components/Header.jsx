import React from 'react';
import { Download, FileJson, Image as ImageIcon, Plus, Upload } from 'lucide-react';

const Header = ({ onLoadSpec, onAddSdtm, onAddAdam, onViewSpec, onExportYaml, onExportSvg, onDownloadR }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl">
        <button onClick={onLoadSpec} className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-all duration-200" title="Load Spec">
          <Upload size={20} />
        </button>
        <button onClick={onViewSpec} className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-all duration-200" title="View Spec (YAML)">
          <FileJson size={20} />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        <button onClick={onExportYaml} className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-all duration-200" title="Export YAML">
          <Download size={20} />
        </button>
        <button onClick={onExportSvg} className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-all duration-200" title="Export SVG">
          <ImageIcon size={20} />
        </button>
        <button onClick={onDownloadR} className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-all duration-200" title="Download R Script">
          <span className="font-bold text-xs border border-current rounded px-1">R</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onAddSdtm} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 backdrop-blur-sm text-sm font-medium flex items-center gap-2">
          <Plus size={18} />
          SDTM
        </button>
        <button onClick={onAddAdam} className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 backdrop-blur-sm text-sm font-medium flex items-center gap-2">
          <Plus size={18} />
          ADaM
        </button>
      </div>
    </div>
  );
};

export default Header;
