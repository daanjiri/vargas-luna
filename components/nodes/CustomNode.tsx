'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { DocumentationNodeData, nodeTypeConfig } from '@/lib/types';
import { 
  Volume2, 
  FileText, 
  ExternalLink, 
  Type, 
  Video, 
  Image,
  ImageIcon,
  LucideIcon 
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Volume2,
  FileText,
  ExternalLink,
  Type,
  Video,
  Image,
  ImageIcon,
};

export const CustomNode: React.FC<NodeProps<DocumentationNodeData>> = ({ data }) => {
  const config = nodeTypeConfig[data.type];
  const Icon = iconMap[config.icon];

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Card 
        className={`p-4 min-w-[150px] cursor-pointer transition-all hover:shadow-lg ${config.color}`}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <span className="font-medium text-sm">{data.title}</span>
        </div>
      </Card>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}; 