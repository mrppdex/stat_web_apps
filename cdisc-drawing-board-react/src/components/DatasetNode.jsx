import React, { memo } from 'react';
import { Settings, Trash2, PlusCircle } from 'lucide-react';
import Column from './Column';

const DatasetNode = ({ data, selected }) => {
  const { dataset, onDelete, onAddColumn, onEdit, onSelect, onColumnClick } = data;

  const headerColor = dataset.type === 'SDTM'
    ? 'bg-gradient-to-r from-blue-900/40 to-blue-800/40 text-blue-100 border-b border-blue-500/20'
    : 'bg-gradient-to-r from-purple-900/40 to-purple-800/40 text-purple-100 border-b border-purple-500/20';

  return (
    <div
      className={`glass - card rounded - xl shadow - 2xl min - w - [300px] transition - all duration - 300 ${selected ? 'ring-2 ring-primary-color ring-opacity-50 shadow-primary-color/20' : 'hover:shadow-xl hover:border-white/20'} `}
      onClick={(e) => { e.stopPropagation(); onSelect(dataset.name); }}
    >
      <div className={`flex justify - between items - center px - 4 py - 3 font - semibold rounded - t - xl ${headerColor} `}>
        <span className="flex-grow text-sm tracking-wide">{dataset.name} ({dataset.type})</span>
        <div className="flex items-center gap-3">
          {dataset.type === 'ADaM' && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(dataset); }}
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md nodrag group"
              title="Settings"
            >
              <Settings size={16} className="text-slate-300 group-hover:text-white" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onAddColumn(dataset); }}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md nodrag group"
            title="Add Column"
          >
            <PlusCircle size={16} className="text-slate-300 group-hover:text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(dataset.name); }}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md nodrag group"
            title="Delete Dataset"
          >
            <Trash2 size={16} className="text-red-400 group-hover:text-red-300" />
          </button>
        </div>
      </div>
      <div className="p-0">
        {dataset.columns.map(col => (
          <Column
            key={col.name}
            dataset={dataset}
            column={col}
            onClick={(e) => {
              e.stopPropagation();
              if (onColumnClick) onColumnClick(dataset.name, col.name);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(DatasetNode);
