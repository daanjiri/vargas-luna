'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DocumentationNodeData } from '@/lib/types';

interface EditNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateNode: (data: Partial<DocumentationNodeData>) => void;
  node: DocumentationNodeData | null;
}

export const EditNodeDialog: React.FC<EditNodeDialogProps> = ({
  open,
  onOpenChange,
  onUpdateNode,
  node,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrls, setImageUrls] = useState<string>('');

  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setContent(node.content || '');
      setUrl(node.url || '');
      setImageUrls(node.images ? node.images.join('\n') : '');
    }
  }, [node]);

  const handleSubmit = () => {
    if (!title) return;

    const imageUrlsArray = node?.type === 'image' && imageUrls
      ? imageUrls.split('\n').map(url => url.trim()).filter(url => url)
      : undefined;

    onUpdateNode({
      title,
      content: node?.type === 'text' ? content : undefined,
      url: node && ['audio', 'pdf', 'link', 'video'].includes(node.type) ? url : undefined,
      images: node?.type === 'image' ? imageUrlsArray : undefined,
    });

    onOpenChange(false);
  };

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {node.type} Node</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter node title"
            />
          </div>
          {node.type === 'text' ? (
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                placeholder="Enter text content"
                rows={4}
              />
            </div>
          ) : node.type === 'image' ? (
            <div>
              <Label htmlFor="imageUrls">Image URLs (one per line)</Label>
              <Textarea
                id="imageUrls"
                value={imageUrls}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImageUrls(e.target.value)}
                placeholder="Enter image URLs, one per line"
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Add multiple images to create a carousel
              </p>
            </div>
          ) : ['audio', 'pdf', 'link', 'video'].includes(node.type) ? (
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL"
                type="url"
              />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 