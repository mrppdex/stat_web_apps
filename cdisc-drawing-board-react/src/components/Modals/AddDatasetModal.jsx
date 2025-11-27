import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddDatasetModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [groupKeys, setGroupKeys] = useState('');
  const [columns, setColumns] = useState([
    { name: 'STUDYID', desc: 'Study Identifier', key: true },
    { name: 'USUBJID', desc: 'Unique Subject Identifier', key: true }
  ]);

  if (!isOpen) return null;

  const handleAddColumn = () => {
    setColumns([...columns, { name: '', desc: '', key: false }]);
  };

  const handleRemoveColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleColumnChange = (index, field, value) => {
    const newCols = [...columns];
    newCols[index][field] = value;
    setColumns(newCols);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    onCreate(name.toUpperCase(), columns.map(c => ({ ...c, name: c.name.toUpperCase() })), groupKeys.split(',').map(k => k.trim().toUpperCase()).filter(k => k));
    onClose();
    setName('');
    setGroupKeys('');
    setColumns([
      { name: 'STUDYID', desc: 'Study Identifier', key: true },
      { name: 'USUBJID', desc: 'Unique Subject Identifier', key: true }
    ]);
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="glass-panel p-0 rounded-xl w-[90%] max-w-[600px] shadow-2xl overflow-hidden border border-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 pointer-events-none" />

        <div className="p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Add New ADaM Dataset</h2>
          <p className="text-sm text-slate-400 mt-1">Create a new analysis dataset definition</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="datasetName" className="block text-sm font-medium text-slate-300 mb-2">Dataset Name</label>
              <input
                type="text"
                id="datasetName"
                className="mt-1 block w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                placeholder="e.g., ADSL"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label htmlFor="groupKeys" className="block text-sm font-medium text-slate-300 mb-2">Group Keys (Optional)</label>
              <input
                type="text"
                id="groupKeys"
                className="mt-1 block w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                placeholder="e.g., STUDYID, USUBJID, PARAMCD"
                value={groupKeys}
                onChange={(e) => setGroupKeys(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">Comma-separated list of columns to group by during derivation.</p>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-fg">Columns</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {columns.map((col, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={col.name}
                    onChange={(e) => handleColumnChange(idx, 'name', e.target.value)}
                    className="flex-1 block w-full px-2 py-1 text-sm bg-[#0f1322] border border-border rounded text-fg"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={col.desc}
                    onChange={(e) => handleColumnChange(idx, 'desc', e.target.value)}
                    className="flex-1 block w-full px-2 py-1 text-sm bg-[#0f1322] border border-border rounded text-fg"
                  />
                  <label className="flex items-center text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={col.key}
                      onChange={(e) => handleColumnChange(idx, 'key', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-1"
                    />
                    Key
                  </label>
                  <button type="button" onClick={() => handleRemoveColumn(idx)} className="text-red-500 hover:text-red-400">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={handleAddColumn} className="text-sm text-blue-400 hover:text-blue-300">+ Add Custom Column</button>
            </div>
            <div className="mt-8 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 px-6 py-2.5 rounded-lg transition-all duration-200 font-medium">Cancel</button>
              <button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 font-medium transform hover:-translate-y-0.5">Create Dataset</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDatasetModal;
