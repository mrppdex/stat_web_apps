import React, { useState } from 'react';
import yaml from 'js-yaml';
import { Copy, Check } from 'lucide-react';

const SpecModal = ({ isOpen, onClose, spec }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const yamlSpec = yaml.dump(spec);

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlSpec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="glass-panel p-0 rounded-xl w-[90%] max-w-[800px] h-[80vh] shadow-2xl overflow-hidden border border-white/10 relative flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />

        <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Specification (YAML)</h2>
            <p className="text-sm text-slate-400 mt-1">Current mapping specification</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium text-slate-300 hover:text-white"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy YAML'}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-black/20 custom-scrollbar">
          <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap">{yamlSpec}</pre>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
          <button onClick={onClose} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 px-6 py-2.5 rounded-lg transition-all duration-200 font-medium">Close</button>
        </div>
      </div>
    </div>
  );
};

export default SpecModal;
