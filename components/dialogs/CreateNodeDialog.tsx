'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DocumentationType } from '@/lib/types';

interface CreateNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNode: (data: {
    type: DocumentationType;
    title: string;
    content?: string;
    url?: string;
    images?: string[];
  }) => void;
  position: { x: number; y: number };
}

export const CreateNodeDialog: React.FC<CreateNodeDialogProps> = ({
  open,
  onOpenChange,
  onCreateNode,
}) => {
  const [type, setType] = useState<DocumentationType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrls, setImageUrls] = useState<string>('');

  const handleSubmit = () => {
    if (!title) return;

    const imageUrlsArray = type === 'image' && imageUrls
      ? imageUrls.split('\n').map(url => url.trim()).filter(url => url)
      : undefined;

    onCreateNode({
      type,
      title,
      content: type === 'text' ? content : undefined,
      url: ['audio', 'pdf', 'link', 'video'].includes(type) ? url : undefined,
      images: type === 'image' ? imageUrlsArray : undefined,
    });

    // Reset form
    setType('text');
    setTitle('');
    setContent('');
    setUrl('');
    setImageUrls('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Documentation Node</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as DocumentationType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="link">External Link</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter node title"
            />
          </div>
          {type === 'text' ? (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                placeholder="Enter text content"
                className="resize-none h-32 overflow-y-auto"
              />
            </div>
          ) : type === 'image' ? (
            <div className="space-y-2">
              <Label htmlFor="imageUrls">Image URLs (one per line)</Label>
              <Textarea
                id="imageUrls"
                value={imageUrls}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImageUrls(e.target.value)}
                placeholder="Enter image URLs, one per line"
                className="resize-none h-32 overflow-y-auto"
              />
              <p className="text-sm text-muted-foreground">
                Add multiple images to create a carousel
              </p>
            </div>
          ) : ['audio', 'pdf', 'link', 'video'].includes(type) ? (
            <div className="space-y-2">
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
            Create Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 