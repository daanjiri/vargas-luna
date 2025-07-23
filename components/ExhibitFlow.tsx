'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  useReactFlow,
  ReactFlowInstance,
  XYPosition,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useExhibitStore } from '@/lib/store';
import { CustomNode } from './nodes/CustomNode';
import { CreateNodeDialog } from './dialogs/CreateNodeDialog';
import { EditNodeDialog } from './dialogs/EditNodeDialog';
import { ExhibitModal } from './modals/ExhibitModal';
import { AudioModal } from './modals/AudioModal';
import { PDFModal } from './modals/PDFModal';
import { TextModal } from './modals/TextModal';
import { VideoModal } from './modals/VideoModal';
import { ImageModal } from './modals/ImageModal';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { DocumentationNodeData, DocumentationType } from '@/lib/types';

const nodeTypes = {
  custom: CustomNode,
};

const FlowCanvas = () => {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [createNodeOpen, setCreateNodeOpen] = useState(false);
  const [createNodePosition, setCreateNodePosition] = useState<XYPosition>({ x: 0, y: 0 });
  const [editNodeOpen, setEditNodeOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<DocumentationNodeData | null>(null);
  const [contextMenuNode, setContextMenuNode] = useState<string | null>(null);
  
  // Modal states
  const [exhibitModalOpen, setExhibitModalOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalData, setModalData] = useState<DocumentationNodeData | null>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNode,
    deleteNode,
  } = useExhibitStore();

  // Listen for Add Node button clicks from FlowManager
  useEffect(() => {
    const handleAddNodeClick = () => {
      setCreateNodePosition({ x: 250, y: 250 });
      setCreateNodeOpen(true);
    };

    window.addEventListener('addNodeClick', handleAddNodeClick);
    return () => window.removeEventListener('addNodeClick', handleAddNodeClick);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (reactFlowInstance.current) {
        const position = reactFlowInstance.current.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        setCreateNodePosition(position);
        setCreateNodeOpen(true);
      }
    },
    []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    const nodeData = node.data as DocumentationNodeData;
    setModalData(nodeData);

    switch (nodeData.type) {
      case 'exhibit':
        setExhibitModalOpen(true);
        break;
      case 'audio':
        setAudioModalOpen(true);
        break;
      case 'pdf':
        setPdfModalOpen(true);
        break;
      case 'link':
        if (nodeData.url) {
          window.open(nodeData.url, '_blank');
        }
        break;
      case 'text':
        setTextModalOpen(true);
        break;
      case 'video':
        setVideoModalOpen(true);
        break;
      case 'image':
        setImageModalOpen(true);
        break;
    }
  }, []);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.preventDefault();
      setContextMenuNode(node.id);
      const nodeData = nodes.find(n => n.id === node.id)?.data;
      if (nodeData) {
        setSelectedNode(nodeData);
      }
    },
    [nodes]
  );

  const handleCreateNode = useCallback(
    (data: { type: DocumentationType; title: string; content?: string; url?: string; images?: string[] }) => {
      const id = `node-${Date.now()}`;
      const newNode = {
        id,
        type: 'custom' as const,
        position: createNodePosition,
        data: {
          id,
          ...data,
        },
      };
      addNode(newNode);
    },
    [createNodePosition, addNode]
  );

  const handleUpdateNode = useCallback(
    (data: Partial<DocumentationNodeData>) => {
      if (selectedNode) {
        updateNode(selectedNode.id, data);
      }
    },
    [selectedNode, updateNode]
  );

  const handleDeleteNode = useCallback(() => {
    if (contextMenuNode) {
      deleteNode(contextMenuNode);
    }
    setContextMenuNode(null);
  }, [contextMenuNode, deleteNode]);

  const handleEditNode = useCallback(() => {
    setEditNodeOpen(true);
    setContextMenuNode(null);
  }, []);

  // Modal edit and delete handlers
  const handleEditFromModal = useCallback(() => {
    if (modalData) {
      setSelectedNode(modalData);
      setEditNodeOpen(true);
      // Close all modals
      setExhibitModalOpen(false);
      setAudioModalOpen(false);
      setPdfModalOpen(false);
      setTextModalOpen(false);
      setVideoModalOpen(false);
      setImageModalOpen(false);
    }
  }, [modalData]);

  const handleDeleteFromModal = useCallback(() => {
    if (modalData && confirm('Are you sure you want to delete this node?')) {
      deleteNode(modalData.id);
      // Close all modals
      setExhibitModalOpen(false);
      setAudioModalOpen(false);
      setPdfModalOpen(false);
      setTextModalOpen(false);
      setVideoModalOpen(false);
      setImageModalOpen(false);
      setModalData(null);
    }
  }, [modalData, deleteNode]);

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(instance) => (reactFlowInstance.current = instance)}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
      >
        <Background />
        <Controls />
        
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 bg-white/80 dark:bg-black/80 backdrop-blur rounded-lg shadow-sm border">
              <h2 className="text-2xl font-semibold mb-2">Welcome to Art Exhibit Documentation Flow</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Start building your documentation graph</p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
                <p>• Click "Add Node" or drag anywhere on the canvas to create nodes</p>
                <p>• Connect nodes by dragging from one handle to another</p>
                <p>• Right-click nodes to edit or delete them</p>
              </div>
            </div>
          </div>
        )}
      </ReactFlow>

      {/* Context Menu */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="absolute inset-0 pointer-events-none" />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleEditNode}>Edit</ContextMenuItem>
          <ContextMenuItem onClick={handleDeleteNode} className="text-red-600">
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Dialogs */}
      <CreateNodeDialog
        open={createNodeOpen}
        onOpenChange={setCreateNodeOpen}
        onCreateNode={handleCreateNode}
        position={createNodePosition}
      />
      <EditNodeDialog
        open={editNodeOpen}
        onOpenChange={setEditNodeOpen}
        onUpdateNode={handleUpdateNode}
        node={selectedNode}
      />

      {/* Modals */}
      {modalData && (
        <>
          <ExhibitModal
            open={exhibitModalOpen}
            onOpenChange={setExhibitModalOpen}
            title={modalData.title}
            images={modalData.images || []}
            onEdit={handleEditFromModal}
            onDelete={handleDeleteFromModal}
          />
          <AudioModal
            open={audioModalOpen}
            onOpenChange={setAudioModalOpen}
            title={modalData.title}
            url={modalData.url || ''}
            onEdit={handleEditFromModal}
            onDelete={handleDeleteFromModal}
          />
          <PDFModal
            open={pdfModalOpen}
            onOpenChange={setPdfModalOpen}
            title={modalData.title}
            url={modalData.url || ''}
            onEdit={handleEditFromModal}
            onDelete={handleDeleteFromModal}
          />
          <TextModal
            open={textModalOpen}
            onOpenChange={setTextModalOpen}
            title={modalData.title}
            content={modalData.content || ''}
            onEdit={handleEditFromModal}
            onDelete={handleDeleteFromModal}
          />
          <VideoModal
            open={videoModalOpen}
            onOpenChange={setVideoModalOpen}
            title={modalData.title}
            url={modalData.url || ''}
            onEdit={handleEditFromModal}
            onDelete={handleDeleteFromModal}
          />
          <ImageModal
            open={imageModalOpen}
            onOpenChange={setImageModalOpen}
            title={modalData.title}
            images={modalData.images || []}
            onEdit={handleEditFromModal}
            onDelete={handleDeleteFromModal}
          />
        </>
      )}
    </div>
  );
};

export const ExhibitFlow = () => {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}; 