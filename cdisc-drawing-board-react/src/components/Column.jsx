import React from 'react';
import { Handle, Position } from '@xyflow/react';

const Column = ({ dataset, column, onClick }) => {
  const isSdtm = dataset.type === 'SDTM';

  return (
    <div
      className={`relative p-2 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors group flex items-center justify-between ${column.required ? 'font-medium' : 'text-muted'}`}
      onClick={onClick}
    >
      <span className="text-sm">{column.name}</span>
      <span className="text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-2">{column.label}</span>

      {/* Source Handle (Right side) - For SDTM columns connecting to ADaM, AND for ADaM columns to be sources for others */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${column.name}-source`} // Unique ID for source handle
        className={`!w-3 !h-3 !border-2 !border-bg ${isSdtm ? '!bg-blue-500' : '!bg-purple-500'}`}
        style={{ right: -6 }}
      />

      {/* Target Handle (Left side) - For ADaM columns receiving connections */}
      {!isSdtm && (
        <Handle
          type="target"
          position={Position.Left}
          id={`${column.name}-target`} // Unique ID for target handle
          className="!w-3 !h-3 !bg-purple-500 !border-2 !border-bg"
          style={{ left: -6 }}
        />
      )}
    </div>
  );
};

export default Column;
