'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, FileText, LayoutGrid, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlowData } from '@/lib/aws/dynamodb';
import { Navigation } from '@/components/Navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GanttChart } from '@/components/GanttChart';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function PublicEventsPage() {
  const [events, setEvents] = useState<FlowData[]>([]);
  const [allEvents, setAllEvents] = useState<FlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [view, setView] = useState<'card' | 'timeline'>('card');
  const router = useRouter();
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadEvents = useCallback(async (cursor?: string) => {
    if (!cursor) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await fetch(
        `/api/events/public?limit=10${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
      );

      if (response.ok) {
        const data = await response.json();
        
        if (cursor) {
          // Append to existing events for infinite scroll
          setEvents(prev => [...prev, ...data.flows]);
        } else {
          // Replace events for initial load
          setEvents(data.flows || []);
        }
        
        setHasMore(data.pagination?.hasMore || false);
        setNextCursor(data.pagination?.nextCursor || null);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Load all events for timeline view
  const loadAllEvents = useCallback(async () => {
    setLoading(true);
    let allFetchedEvents: FlowData[] = [];
    let cursor: string | null = null;
    
    try {
      do {
        const response: Response = await fetch(
          `/api/events/public?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
        );

        if (response.ok) {
          const data: any = await response.json();
          allFetchedEvents = [...allFetchedEvents, ...(data.flows || [])];
          cursor = data.pagination?.nextCursor || null;
        } else {
          break;
        }
      } while (cursor);
      
      setAllEvents(allFetchedEvents);
    } catch (error) {
      console.error('Failed to load all events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (view === 'card') {
      loadEvents();
    } else {
      loadAllEvents();
    }
  }, [view, loadEvents, loadAllEvents]);

  // Infinite scroll observer
  useEffect(() => {
    if (view !== 'card') return; // Only enable infinite scroll for card view
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && nextCursor) {
          loadEvents(nextCursor);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, nextCursor, loadEvents]);

  const handleViewEvent = (flowId: string) => {
    router.push(`/flow/${flowId}`);
  };

  if (loading && view === 'card') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className={view === 'timeline' ? "w-full px-4" : "container mx-auto py-8 px-4 max-w-6xl"}>
        <div className={view === 'timeline' ? "flex justify-end py-4" : "flex justify-between items-center mb-8"}>
          {view === 'card' && (
            <div>
              <h1 className="text-4xl font-bold mb-2">Art Exhibition Events</h1>
              <p className="text-muted-foreground">
                Discover and explore art exhibitions created by our community
              </p>
            </div>
          )}
          <ToggleGroup type="single" value={view} onValueChange={(value: 'card' | 'timeline') => value && setView(value)}>
            <ToggleGroupItem value="card" aria-label="Card view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="timeline" aria-label="Timeline view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {view === 'card' ? (
          <>
            {events.length === 0 && !loading ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">No events have been created yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <Card 
                    key={event.flow_id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleViewEvent(event.flow_id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="line-clamp-2 flex-1">{event.title}</CardTitle>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ml-2 ${
                          event.event_type === 'exhibition' 
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            : event.event_type === 'research'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}>
                          {event.event_type ? event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1) : 'Exhibition'}
                        </span>
                      </div>
                      {event.description && (
                        <CardDescription className="line-clamp-3">
                          {event.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {(event.start_date || event.end_date) && (
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {event.start_date && new Date(event.start_date).toLocaleDateString()}
                              {event.start_date && event.end_date && ' - '}
                              {event.end_date && new Date(event.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Created: {formatDate(event.created_at)}</span>
                        </div>
                        <div className="pt-2">
                          <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                            {event.nodes?.length || 0} nodes
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <div>
            <GanttChart events={allEvents} />
          </div>
        )}

        {/* Infinite scroll trigger - only show for card view */}
        {view === 'card' && (
          <div ref={observerTarget} className="h-10 mt-8">
            {loadingMore && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {!hasMore && events.length > 0 && view === 'card' && (
          <p className="text-center text-muted-foreground mt-8">
            You've reached the end of all events
          </p>
        )}
      </div>
    </div>
  );
} 