import { Node, Edge } from 'reactflow';

export type DocumentationType = 'audio' | 'pdf' | 'link' | 'text' | 'video' | 'exhibit' | 'image';

export interface DocumentationNodeData {
  id: string;
  type: DocumentationType;
  title: string;
  content?: string; // For text nodes
  url?: string; // For audio, pdf, link, video nodes
  images?: string[]; // For exhibit and image nodes carousel
}

export type DocumentationNode = Node<DocumentationNodeData>;
export type DocumentationEdge = Edge;

export interface ExhibitData {
  nodes: DocumentationNode[];
  edges: DocumentationEdge[];
}

export const nodeTypeConfig = {
  audio: {
    icon: 'Volume2',
    color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
  },
  pdf: {
    icon: 'FileText',
    color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  },
  link: {
    icon: 'ExternalLink',
    color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  },
  text: {
    icon: 'Type',
    color: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  },
  video: {
    icon: 'Video',
    color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
  },
  exhibit: {
    icon: 'Image',
    color: 'bg-gray-100 dark:bg-gray-800/30 border-gray-300 dark:border-gray-700',
  },
  image: {
    icon: 'ImageIcon',
    color: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700',
  },
}; 