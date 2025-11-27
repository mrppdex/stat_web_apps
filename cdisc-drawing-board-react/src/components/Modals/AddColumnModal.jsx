import React, { useState } from 'react';

const AddColumnModal = ({ isOpen, onClose, onAdd, datasetName }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [key, setKey] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    onAdd(datasetName, { name: name.toUpperCase(), desc, key });
    onClose();
    setName('');
    setDesc('');
    setKey(false);
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="glass-panel p-6 rounded-xl border border-white/10 w-[90%] max-w-[700px] shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-fg">Add Column to {datasetName}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="newColName" className="block text-sm font-medium text-gray-400">Column Name</label>
              <input
                type="text"
                id="newColName"
                className="mt-1 block w-full px-3 py-2 bg-[#0f1322] border border-border rounded-md text-fg focus:outline-none focus:ring-accent focus:border-accent"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="newColDesc" className="block text-sm font-medium text-gray-400">Description</label>
              <input
                type="text"
                id="newColDesc"
                className="mt-1 block w-full px-3 py-2 bg-[#0f1322] border border-border rounded-md text-fg focus:outline-none focus:ring-accent focus:border-accent"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="newColKey"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                checked={key}
                onChange={(e) => setKey(e.target.checked)}
              />
              <label htmlFor="newColKey" className="ml-2 block text-sm text-gray-300">Is Key Column</label>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 px-6 py-2.5 rounded-lg transition-all duration-200 font-medium">Cancel</button>
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 font-medium transform hover:-translate-y-0.5">Add Column</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddColumnModal;
