import React, { useState, useEffect } from 'react';

const DerivationModal = ({ isOpen, onClose, onSave, datasetName, columnName, currentDerivation, sourceColumns }) => {
  const [description, setDescription] = useState('');
  const [logic, setLogic] = useState('');
  const [groupBy, setGroupBy] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescription(currentDerivation?.derivationDescription || '');
      setLogic(currentDerivation?.derivationLogic || '');
      setGroupBy(currentDerivation?.groupBy || '');
    }
  }, [isOpen, currentDerivation]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(datasetName, columnName, { description, logic, groupBy });
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="glass-panel p-6 rounded-xl border border-white/10 w-[90%] max-w-[700px] shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-fg">Edit Derivation for {datasetName}.{columnName}</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400">Source Columns</label>
          <div className="mt-1 p-2 bg-[#0f1322] border border-border rounded-md text-sm text-gray-400 min-h-[40px]">
            {sourceColumns && sourceColumns.length > 0 ? (
              <ul className="list-disc pl-5">
                {sourceColumns.map((src, idx) => (
                  <li key={idx} className="font-mono">{src}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No source columns connected.</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="derivationDescription" className="block text-sm font-medium text-gray-400">Description</label>
            <textarea
              id="derivationDescription"
              rows="3"
              className="mt-1 block w-full px-3 py-2 bg-[#0f1322] border border-border rounded-md text-fg focus:outline-none focus:ring-accent focus:border-accent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="derivationLogic" className="block text-sm font-medium text-gray-400">Derivation Logic</label>
            <textarea
              id="derivationLogic"
              rows="5"
              className="mt-1 block w-full px-3 py-2 bg-[#0f1322] border border-border rounded-md text-fg font-mono focus:outline-none focus:ring-accent focus:border-accent"
              value={logic}
              onChange={(e) => setLogic(e.target.value)}
            ></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="derivationGroupBy" className="block text-sm font-medium text-gray-400">Group By Keys (comma-separated, optional)</label>
            <input
              type="text"
              id="derivationGroupBy"
              className="mt-1 block w-full px-3 py-2 bg-[#0f1322] border border-border rounded-md text-fg focus:outline-none focus:ring-accent focus:border-accent"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              placeholder="e.g., USUBJID, APERIOD"
            />
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 px-6 py-2.5 rounded-lg transition-all duration-200 font-medium">Cancel</button>
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 font-medium transform hover:-translate-y-0.5">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DerivationModal;
