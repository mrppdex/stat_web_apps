import React, { useState, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge, applyNodeChanges, applyEdgeChanges, useReactFlow } from '@xyflow/react';
import yaml from 'js-yaml';
import { toSvg } from 'html-to-image';
import dagre from 'dagre';
import Header from './components/Header';
import Canvas from './components/Canvas';
import SdtmSelectionModal from './components/Modals/SdtmSelectionModal';
import AddDatasetModal from './components/Modals/AddDatasetModal';
import EditDatasetModal from './components/Modals/EditDatasetModal';
import AddColumnModal from './components/Modals/AddColumnModal';
import DerivationModal from './components/Modals/DerivationModal';
import SpecModal from './components/Modals/SpecModal';
import LoadSpecModal from './components/Modals/LoadSpecModal';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 320;
const headerHeight = 60;
const columnHeight = 40;

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    // Estimate height based on columns
    const numColumns = node.data.dataset.columns ? node.data.dataset.columns.length : 0;
    const nodeHeight = headerHeight + (numColumns * columnHeight) + 20; // +20 for padding
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - (headerHeight + (node.data.dataset.columns ? node.data.dataset.columns.length : 0) * columnHeight + 20) / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { getNodes, getEdges, fitView } = useReactFlow();

  // Modal states
  const [isSdtmModalOpen, setSdtmModalOpen] = useState(false);
  const [isAddDatasetModalOpen, setAddDatasetModalOpen] = useState(false);
  const [editDatasetModalData, setEditDatasetModalData] = useState(null);
  const [addColumnModalData, setAddColumnModalData] = useState(null);
  const [derivationModalData, setDerivationModalData] = useState(null);
  const [specModalData, setSpecModalData] = useState(null);
  const [isLoadSpecModalOpen, setLoadSpecModalOpen] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#34d399', strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  const onAutoLayout = useCallback(() => {
    const layouted = getLayoutedElements(getNodes(), getEdges());
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
    window.requestAnimationFrame(() => fitView());
  }, [getNodes, getEdges, setNodes, setEdges, fitView]);

  const handleColumnClick = (datasetName, columnName) => {
    // Use getNodes() and getEdges() to ensure we have the latest state
    const currentNodes = getNodes();
    const currentEdges = getEdges();

    const node = currentNodes.find(n => n.data.dataset.name === datasetName);
    if (!node) return;

    const ds = node.data.dataset;
    if (ds.type !== 'ADaM') return;

    const col = ds.columns.find(c => c.name === columnName);
    const sources = currentEdges
      .filter(e => e.target === node.id && e.targetHandle === `${columnName}-target`)
      .map(e => {
        const sourceNode = currentNodes.find(n => n.id === e.source);
        const sourceDsName = sourceNode ? sourceNode.data.dataset.name : 'Unknown';
        const sourceCol = e.sourceHandle.replace('-source', '');
        return `${sourceDsName}.${sourceCol}`;
      });

    setDerivationModalData({
      datasetName,
      columnName,
      currentDerivation: col,
      sourceColumns: sources
    });
  };

  // Helper to create node data
  const createNodeData = (dataset) => ({
    dataset,
    onDelete: (name) => handleDeleteDataset(name),
    onAddColumn: (ds) => setAddColumnModalData(ds.name),
    onEdit: (ds) => setEditDatasetModalData(ds),
    onSelect: (name) => {
      setNodes((nds) => nds.map((node) => ({
        ...node,
        selected: node.data.dataset.name === name
      })));
    },
    onColumnClick: (dsName, colName) => handleColumnClick(dsName, colName)
  });

  const addDataset = (name, type, columns, position = { x: 100, y: 100 }, groupKeys = []) => {
    const newDataset = {
      id: `ds-${name}`,
      name,
      type,
      columns,
      joinKeys: [],
      groupKeys: groupKeys,
      oneRowPerSubject: false,
    };

    const newNode = {
      id: newDataset.id,
      type: 'dataset',
      position,
      data: createNodeData(newDataset),
    };

    setNodes((nds) => nds.concat(newNode));
  };

  const handleAddSdtm = (domain, columns) => {
    addDataset(domain, 'SDTM', columns, { x: Math.random() * 400, y: Math.random() * 400 });
  };

  const handleAddAdam = (name, columns, groupKeys = []) => {
    addDataset(name, 'ADaM', columns, { x: Math.random() * 400 + 400, y: Math.random() * 400 }, groupKeys);
  };

  const handleUpdateDataset = (name, updates) => {
    setNodes((nds) => nds.map((node) => {
      if (node.data.dataset.name === name) {
        const updatedDataset = { ...node.data.dataset, ...updates };
        return {
          ...node,
          data: createNodeData(updatedDataset)
        };
      }
      return node;
    }));
  };

  const handleAddColumn = (datasetName, newCol) => {
    setNodes((nds) => nds.map((node) => {
      if (node.data.dataset.name === datasetName) {
        const updatedDataset = {
          ...node.data.dataset,
          columns: [...node.data.dataset.columns, newCol]
        };
        return {
          ...node,
          data: createNodeData(updatedDataset)
        };
      }
      return node;
    }));
  };

  const handleDeleteDataset = (name) => {
    if (window.confirm(`Delete dataset ${name}?`)) {
      setNodes((nds) => nds.filter((node) => node.data.dataset.name !== name));
      // Edges connected to this node will be automatically removed by React Flow if we use onNodesChange correctly,
      // but explicit filtering is safer for custom logic
      const nodeId = `ds-${name}`;
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    }
  };

  const handleSaveDerivation = (datasetName, columnName, derivation) => {
    setNodes((nds) => nds.map((node) => {
      if (node.data.dataset.name === datasetName) {
        const newCols = node.data.dataset.columns.map(col =>
          col.name === columnName
            ? { ...col, derivationDescription: derivation.description, derivationLogic: derivation.logic }
            : col
        );
        const updatedDataset = { ...node.data.dataset, columns: newCols };
        return {
          ...node,
          data: createNodeData(updatedDataset)
        };
      }
      return node;
    }));
  };

  const handleExportYaml = () => {
    const spec = generateSpec();
    const yamlStr = yaml.dump(spec);
    const blob = new Blob([yamlStr], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cdisc-mapping-spec.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSvg = () => {
    if (nodes.length === 0) return;

    // Calculate bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      // Assuming a default node width/height if not available, or estimating.
      // DatasetNode is roughly 250px wide and variable height.
      // Let's assume a safe bounding box.
      // Ideally we should use getNodesBounds from reactflow if available or store dimensions.
      // For now, let's estimate max extent based on node content or a fixed size.
      // A safer bet is to use the viewport with a transform that covers everything.
      maxX = Math.max(maxX, node.position.x + 300); // Estimate width
      maxY = Math.max(maxY, node.position.y + (node.data.dataset.columns.length * 30 + 100)); // Estimate height
    });

    const width = maxX - minX + 400; // Increased Padding for right-side links
    const height = maxY - minY + 100; // Padding

    const viewport = document.querySelector('.react-flow__viewport');

    if (viewport) {
      toSvg(viewport, {
        width: width,
        height: height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${-minX + 50}px, ${-minY + 50}px) scale(1)`,
        }
      })
        .then((dataUrl) => {
          // Post-process to add full background
          const [header, content] = dataUrl.split(',');
          const decoded = decodeURIComponent(content);

          // Insert background rect immediately after opening <svg> tag
          const svgTagEnd = decoded.indexOf('>') + 1;
          const backgroundRect = `<rect width="100%" height="100%" fill="#0a0c10"/>`;
          const newSvg = decoded.slice(0, svgTagEnd) + backgroundRect + decoded.slice(svgTagEnd);
          const newDataUrl = header + ',' + encodeURIComponent(newSvg);

          const a = document.createElement('a');
          a.href = newDataUrl;
          a.download = 'cdisc-mapping-diagram.svg';
          a.click();
        })
        .catch((err) => {
          console.error('Failed to export SVG', err);
        });
    }
  };

  const handleDownloadRScript = () => {
    const link = document.createElement('a');
    link.href = '/generate_adam.R';
    link.download = 'generate_adam.R';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSpec = () => {
    return {
      datasets: nodes.map(node => {
        const ds = node.data.dataset;
        return {
          name: ds.name,
          type: ds.type,
          position: node.position,
          join_keys: ds.type === 'ADaM' ? ds.joinKeys : undefined,
          group_keys: ds.type === 'ADaM' ? ds.groupKeys : undefined,
          one_row_per_subject: ds.type === 'ADaM' ? ds.oneRowPerSubject : undefined,
          columns: ds.columns.map(col => {
            const newCol = { name: col.name, desc: col.desc, key: col.key };
            if (ds.type === 'ADaM') {
              newCol.derivation = {
                description: col.derivationDescription || '',
                logic: col.derivationLogic || '',
                sources: edges
                  .filter(e => e.target === node.id && e.targetHandle === `${col.name}-target`)
                  .map(e => {
                    // Find source node to get dataset name
                    const sourceNode = nodes.find(n => n.id === e.source);
                    const sourceDsName = sourceNode ? sourceNode.data.dataset.name : 'Unknown';
                    // Remove '-source' suffix from handle ID to get column name
                    const sourceCol = e.sourceHandle.replace('-source', '');
                    return `${sourceDsName}.${sourceCol}`;
                  })
              };
            }
            return newCol;
          })
        };
      })
    };
  };

  const handleLoadSpec = (spec) => {
    const newNodes = [];
    const newEdges = [];

    let sdtmCount = 0;
    let adamCount = 0;

    spec.datasets.forEach((ds) => {
      const dsId = `ds-${ds.name}`;
      const columns = ds.columns.map(col => {
        const c = { ...col };
        if (c.derivation) {
          c.derivationDescription = c.derivation.description;
          c.derivationLogic = c.derivation.logic;

          // Recreate edges
          if (c.derivation.sources) {
            c.derivation.sources.forEach(sourceStr => {
              const [sourceDsName, sourceColName] = sourceStr.split('.');
              const sourceId = `ds-${sourceDsName}`;
              newEdges.push({
                id: `e-${sourceId}-${sourceColName}-${dsId}-${col.name}`,
                source: sourceId,
                sourceHandle: `${sourceColName}-source`,
                target: dsId,
                targetHandle: `${col.name}-target`,
                animated: true,
                style: { stroke: '#34d399', strokeWidth: 2 }
              });
            });
          }
        }
        return c;
      });

      const dataset = {
        id: dsId,
        name: ds.name,
        type: ds.type,
        columns,
        joinKeys: ds.join_keys || [],
        groupKeys: ds.group_keys || [],
        oneRowPerSubject: ds.one_row_per_subject || false,
      };

      // Auto-layout logic
      let position = ds.position;
      if (!position) {
        if (ds.type === 'SDTM') {
          position = { x: 50, y: 50 + (sdtmCount * 400) }; // Stack vertically on left
          sdtmCount++;
        } else {
          position = { x: 600, y: 50 + (adamCount * 400) }; // Stack vertically on right
          adamCount++;
        }
      }

      newNodes.push({
        id: dsId,
        type: 'dataset',
        position: position,
        data: {
          dataset,
          onDelete: (name) => handleDeleteDataset(name),
          onAddColumn: (ds) => setAddColumnModalData(ds.name),
          onEdit: (ds) => setEditDatasetModalData(ds),
          onSelect: (name) => {
            setNodes((nds) => nds.map((node) => ({
              ...node,
              selected: node.data.dataset.name === name
            })));
          },
          onColumnClick: (dsName, colName) => handleColumnClick(dsName, colName)
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  // Derived edges for rendering
  const getStyledEdges = () => {
    return edges.map(edge => {
      const isIntraDataset = edge.source === edge.target;
      const isSelected = nodes.some(n => n.selected && (n.id === edge.source || n.id === edge.target));
      const hasSelection = nodes.some(n => n.selected);

      let style = { strokeWidth: 2 };
      let animated = true;
      let zIndex = 0;

      if (isIntraDataset) {
        style.stroke = '#f59e0b'; // Amber-500 for intra-dataset
        zIndex = 10;
      } else {
        style.stroke = '#34d399'; // Emerald-400 for standard
      }

      // Dimming logic
      if (hasSelection && !isSelected) {
        style.opacity = 0.1;
        style.stroke = '#94a3b8'; // Slate-400
        animated = false;
      } else {
        style.opacity = 1;
      }

      return {
        ...edge,
        style,
        animated,
        zIndex,
        type: isIntraDataset ? 'smoothstep' : 'default', // Use smoothstep for better visibility of self-loops if needed, though default bezier is usually fine. Let's try default first but maybe adjust curvature if needed. Actually smoothstep is better for self-loops often.
      };
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        onLoadSpec={() => setLoadSpecModalOpen(true)}
        onAddSdtm={() => setSdtmModalOpen(true)}
        onAddAdam={() => setAddDatasetModalOpen(true)}
        onViewSpec={() => setSpecModalData(generateSpec())}
        onExportYaml={handleExportYaml}
        onExportSvg={handleExportSvg}
        onDownloadR={handleDownloadRScript}
        onAutoLayout={onAutoLayout}
      />
      <Canvas
        nodes={nodes}
        edges={getStyledEdges()}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(e, node) => {
          // Optional: handle node click
        }}
        onPaneClick={() => {
          setNodes((nds) => nds.map((node) => ({ ...node, selected: false })));
        }}
      />

      <SdtmSelectionModal
        isOpen={isSdtmModalOpen}
        onClose={() => setSdtmModalOpen(false)}
        onAdd={handleAddSdtm}
      />
      <AddDatasetModal
        isOpen={isAddDatasetModalOpen}
        onClose={() => setAddDatasetModalOpen(false)}
        onCreate={handleAddAdam}
      />
      <EditDatasetModal
        isOpen={!!editDatasetModalData}
        onClose={() => setEditDatasetModalData(null)}
        onSave={handleUpdateDataset}
        dataset={editDatasetModalData}
      />
      <AddColumnModal
        isOpen={!!addColumnModalData}
        onClose={() => setAddColumnModalData(null)}
        onAdd={handleAddColumn}
        datasetName={addColumnModalData}
      />
      <DerivationModal
        isOpen={!!derivationModalData}
        onClose={() => setDerivationModalData(null)}
        onSave={handleSaveDerivation}
        datasetName={derivationModalData?.datasetName}
        columnName={derivationModalData?.columnName}
        currentDerivation={derivationModalData?.currentDerivation}
        sourceColumns={derivationModalData?.sourceColumns}
      />
      <SpecModal
        isOpen={!!specModalData}
        onClose={() => setSpecModalData(null)}
        spec={specModalData}
      />
      <LoadSpecModal
        isOpen={isLoadSpecModalOpen}
        onClose={() => setLoadSpecModalOpen(false)}
        onLoad={handleLoadSpec}
      />
    </div>
  );
}

export default App;
