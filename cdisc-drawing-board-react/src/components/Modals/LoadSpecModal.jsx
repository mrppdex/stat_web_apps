import React, { useState, useRef } from 'react';
import yaml from 'js-yaml';
import { Upload, FileText } from 'lucide-react';
import { testSpec } from '../../utils/testSpecs';

const LoadSpecModal = ({ isOpen, onClose, onLoad }) => {
  const [input, setInput] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const spec = yaml.load(input);
      if (!spec || !spec.datasets) throw new Error("Invalid YAML format: missing 'datasets' key.");
      onLoad(spec);
      onClose();
      setInput('');
    } catch (err) {
      alert("Failed to load YAML: " + err.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setInput(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleLoadTestSpec = () => {
    onLoad(testSpec);
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="glass-panel p-0 rounded-xl w-[90%] max-w-[700px] flex flex-col h-[80vh] shadow-2xl overflow-hidden border border-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />

        <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Load Specification</h2>
            <p className="text-sm text-slate-400 mt-1">Paste YAML, upload file, or use example</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleLoadTestSpec}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium text-slate-300 hover:text-white"
            >
              <FileText size={16} />
              Load Example
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium text-slate-300 hover:text-white"
            >
              <Upload size={16} />
              Upload YAML
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".yaml,.yml,.txt"
            className="hidden"
          />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow p-6">
          <textarea
            placeholder="Paste your YAML specification here..."
            className="w-full flex-grow p-4 rounded-lg font-mono text-sm bg-black/40 border border-white/10 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent custom-scrollbar resize-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          ></textarea>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 px-6 py-2.5 rounded-lg transition-all duration-200 font-medium">Cancel</button>
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 font-medium transform hover:-translate-y-0.5">Load Specification</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoadSpecModal;
