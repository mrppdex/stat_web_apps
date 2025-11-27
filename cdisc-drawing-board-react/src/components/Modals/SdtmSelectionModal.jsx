import React, { useState } from 'react';
import { sdtmDomains } from '../../utils/sdtmDomains';

const SdtmSelectionModal = ({ isOpen, onClose, onAdd }) => {
  const [selectedDomain, setSelectedDomain] = useState(Object.keys(sdtmDomains)[0]);
  const [columnOption, setColumnOption] = useState('all');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    let columns = sdtmDomains[selectedDomain].columns;
    if (columnOption === 'required') {
      columns = columns.filter(c => c.core === 'Required');
    }
    onAdd(selectedDomain, JSON.parse(JSON.stringify(columns)));
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="glass-panel p-0 rounded-xl w-[90%] max-w-[600px] shadow-2xl overflow-hidden border border-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 pointer-events-none" />

        <div className="p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Select SDTM Domain</h2>
          <p className="text-sm text-slate-400 mt-1">Choose a standard domain to add to the board</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="sdtmDomainSelect" className="block text-sm font-medium text-slate-300 mb-2">Domain</label>
              <select
                id="sdtmDomainSelect"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-[#0f1322] border border-border rounded-md text-fg focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                style={{ colorScheme: 'dark' }}
              >
                {Object.entries(sdtmDomains).map(([key, val]) => (
                  <option key={key} value={key} className="bg-card text-fg">{key} - {val.desc}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400">Column Options</label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  <input
                    id="colOptAll"
                    name="columnOption"
                    type="radio"
                    value="all"
                    checked={columnOption === 'all'}
                    onChange={() => setColumnOption('all')}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="colOptAll" className="ml-3 block text-sm font-medium text-gray-300">All Columns (Required + Permissible)</label>
                </div>
                <div className="flex items-center">
                  <input
                    id="colOptReq"
                    name="columnOption"
                    type="radio"
                    value="required"
                    checked={columnOption === 'required'}
                    onChange={() => setColumnOption('required')}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="colOptReq" className="ml-3 block text-sm font-medium text-gray-300">Required Columns Only</label>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 px-6 py-2.5 rounded-lg transition-all duration-200 font-medium">Cancel</button>
              <button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 font-medium transform hover:-translate-y-0.5">Add Domain</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SdtmSelectionModal;
