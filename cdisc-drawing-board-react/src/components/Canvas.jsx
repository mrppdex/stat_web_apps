import React, { useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DatasetNode from './DatasetNode';

const nodeTypes = {
  dataset: DatasetNode,
};

const Canvas = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick }) => {
  return (
    <div className="w-full h-[calc(100vh-60px)] bg-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="glass-flow"
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="bg-card border-border text-fg" />
        <MiniMap
          nodeColor={(n) => {
            if (n.data.dataset.type === 'SDTM') return '#1e3a8a';
            return '#581c87';
          }}
          className="bg-card border-border"
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>
    </div>
  );
};

export default Canvas;
