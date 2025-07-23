'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ProtectedWrapper } from '@/components/auth/protected-wrapper';
import { AuthButton } from '@/components/auth/auth-button';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Plus, Eye, Trash2, Calendar, Clock, Loader2 } from 'lucide-react';

interface FlowEvent {
  flow_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  version: number;
  nodes: any[];
  edges: any[];
}

interface PaginationInfo {
  hasMore: boolean;
  nextCursor?: string;
  limit: number;
}

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    hasMore: boolean;
    lastEvaluatedKey?: string;
  }>({ hasMore: false });
  const [cursors, setCursors] = useState<{ [page: number]: string }>({});
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Load user events with pagination
  useEffect(() => {
    // Only load events if we have a user and auth is not loading
    if (user && !authLoading) {
      loadUserEvents(currentPage);
    } else if (!authLoading) {
      // Auth finished loading but no user
      setLoading(false);
    }
  }, [user, authLoading, currentPage]);

  // Prevent refetching when tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Don't refetch data when tab becomes visible
      // The auth state change will handle any necessary updates
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadUserEvents = async (page: number = 1) => {
    if (!user || authLoading) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const cursor = page > 1 ? cursors[page] : undefined;
      const response = await fetch(`/api/flows/load?limit=10${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.flows || []);
        setPagination({
          hasMore: data.hasMore || false,
          lastEvaluatedKey: data.lastEvaluatedKey,
        });
        
        // Store cursor for next page
        if (data.lastEvaluatedKey) {
          setCursors(prev => ({
            ...prev,
            [page + 1]: data.lastEvaluatedKey,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || creatingEvent) return;
    
    setCreatingEvent(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const flowId = `flow-${Date.now()}`;
      
      // Create empty flow
      const response = await fetch('/api/flows/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          flow_id: flowId,
          title: eventTitle.trim(),
          description: eventDescription.trim() || undefined,
          nodes: [],
          edges: [],
        }),
      });

      if (response.ok) {
        // Reset form
        setEventTitle('');
        setEventDescription('');
        setNewEventOpen(false);
        
        // Navigate to the new flow
        router.push(`/flow/${flowId}`);
      } else {
        const error = await response.json();
        console.error('Failed to create event:', error);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleViewEvent = (flowId: string) => {
    // Add loading state to prevent UI freezing
    setLoading(true);
    router.push(`/flow/${flowId}`);
  };

  const handleDeleteEvent = async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/flows/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ flow_id: flowId }),
      });

      if (response.ok) {
        // Reload current page
        loadUserEvents(currentPage);
      } else {
        console.error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div>
        <div className="flex h-16 items-center px-4 justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Vargas Luna</h1>
          </div>
          <div className="flex items-center gap-2">
      <AuthButton />
          </div>
        </div>
      </div>
      
      <ProtectedWrapper>
        <div className="container mx-auto p-6">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Your Art Events</h2>
            </div>
            <Button onClick={() => setNewEventOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </div>

          {/* Events Table */}
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading events...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No events yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first art exhibition event to get started
                  </p>
                  <Button onClick={() => setNewEventOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Event
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Nodes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.flow_id}>
                          <TableCell className="font-medium max-w-xs truncate">
                            {event.title}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(event.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDate(event.updated_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                              {event.nodes?.length || 0} nodes
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewEvent(event.flow_id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteEvent(event.flow_id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {(currentPage > 1 || pagination.hasMore) && (
                    <div className="mt-6 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          {currentPage > 1 && (
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => handlePageChange(currentPage - 1)}
                                className="cursor-pointer"
                              />
                            </PaginationItem>
                          )}
                          
                          <PaginationItem>
                            <PaginationLink isActive>
                              {currentPage}
                            </PaginationLink>
                          </PaginationItem>
                          
                          {pagination.hasMore && (
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => handlePageChange(currentPage + 1)}
                                className="cursor-pointer"
                              />
                            </PaginationItem>
                          )}
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </ProtectedWrapper>

      {/* New Event Dialog */}
      <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Art Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input
                id="eventTitle"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Enter event title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDescription">Description (optional)</Label>
              <Textarea
                id="eventDescription"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Enter event description"
                className="resize-none h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewEventOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateEvent} 
              disabled={!eventTitle.trim() || creatingEvent}
            >
              {creatingEvent ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
