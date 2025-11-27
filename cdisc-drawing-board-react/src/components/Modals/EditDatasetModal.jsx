import React, { useState, useEffect } from 'react';

const EditDatasetModal = ({ isOpen, onClose, onSave, dataset }) => {
  const [joinKeys, setJoinKeys] = useState('');
  const [groupKeys, setGroupKeys] = useState('');
  const [oneRow, setOneRow] = useState(false);

  useEffect(() => {
    if (dataset) {
      setJoinKeys(dataset.joinKeys.join(', '));
      setGroupKeys(dataset.groupKeys ? dataset.groupKeys.join(', ') : '');
      setOneRow(dataset.oneRowPerSubject);
    }
  }, [dataset]);

  if (!isOpen || !dataset) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(dataset.name, {
      joinKeys: joinKeys.split(',').map(k => k.trim().toUpperCase()).filter(k => k),
      groupKeys: groupKeys.split(',').map(k => k.trim().toUpperCase()).filter(k => k),
      oneRowPerSubject: oneRow
    });
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="glass-panel p-6 rounded-xl border border-white/10 w-[90%] max-w-[700px] shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-fg">Edit Settings for {dataset.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="editDatasetJoinKeys" className="block text-sm font-medium text-gray-400">Join Keys</label>
              <input
                type="text"
                id="editDatasetJoinKeys"
                className="mt-1 block w-full px-3 py-2 bg-[#0f1322] border border-border rounded-md text-fg focus:outline-none focus:ring-accent focus:border-accent"
                placeholder="STUDYID, USUBJID"
                value={joinKeys}
                onChange={(e) => setJoinKeys(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">Comma-separated list of columns to use when joining source datasets.</p>
            </div>
            <div>
              <label htmlFor="editDatasetGroupKeys" className="block text-sm font-medium text-gray-400">Group Keys</label>
              <input
                type="text"
                id="editDatasetGroupKeys"
                className="mt-1 block w-full px-3 py-2 bg-[#0f1322] border border-border rounded-md text-fg focus:outline-none focus:ring-accent focus:border-accent"
                placeholder="STUDYID, USUBJID, PARAMCD"
                value={groupKeys}
                onChange={(e) => setGroupKeys(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">Comma-separated list of columns to group by during derivation.</p>
            </div>
            <div className="flex items-center pt-2">
              <input
                type="checkbox"
                id="editDatasetOneRow"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                checked={oneRow}
                onChange={(e) => setOneRow(e.target.checked)}
              />
              <label htmlFor="editDatasetOneRow" className="ml-2 block text-sm text-gray-300">One row per subject</label>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 px-6 py-2.5 rounded-lg transition-all duration-200 font-medium">Cancel</button>
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 font-medium transform hover:-translate-y-0.5">Save Settings</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDatasetModal;
