'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AudioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string;
}

export const AudioModal: React.FC<AudioModalProps> = ({
  open,
  onOpenChange,
  title,
  url,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <audio controls className="w-full">
            <source src={url} />
            Your browser does not support the audio element.
          </audio>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 