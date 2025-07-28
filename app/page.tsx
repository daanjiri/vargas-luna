'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { GanttChart } from '@/components/GanttChart';
import { FlowData } from '@/lib/aws/dynamodb';
import { motion } from 'framer-motion';
import { ArrowRight, SquareChartGantt } from 'lucide-react';

export default function PublicEventsPage() {
  const [events, setEvents] = useState<FlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'split'>('split');
  const router = useRouter();

  useEffect(() => {
    loadPublicEvents();
  }, []);

  const loadPublicEvents = async () => {
    try {
      const response = await fetch('/api/events/public');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.flows || []);
      }
    } catch (error) {
      console.error('Failed to load public events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const year = date.getFullYear();
    return { month, day, year };
  };

  const getEventTypeColor = (type?: string) => {
    switch (type) {
      case 'exhibition':
        return 'text-pink-500 dark:text-pink-400';
      case 'research':
        return 'text-blue-500 dark:text-blue-400';
      case 'curation':
        return 'text-green-500 dark:text-green-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const eventsList = (
    <div className="space-y-0">
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-flex items-center space-x-2 text-muted-foreground">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-100" />
            <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-200" />
          </div>
        </div>
      ) : events.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-center text-muted-foreground"
        >
          <p className="text-lg">No events available at the moment</p>
        </motion.div>
      ) : (
        events.map((event, index) => {
          const date = formatDate(event.start_date);
          const isHovered = hoveredEvent === event.flow_id;
          
          return (
            <motion.div
              key={event.flow_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <div
                className="group py-4 cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredEvent(event.flow_id)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={() => router.push(`/flow/${event.flow_id}`)}
              >
                <div className="flex items-center justify-between">
                  {/* Left side - Date and Title */}
                  <div className="flex items-center space-x-6 flex-1">
                    {/* Date */}
                    <div className="w-20 flex-shrink-0">
                      {date === '—' ? (
                        <span className="text-xl font-light text-gray-400 dark:text-gray-600">—</span>
                      ) : (
                        <div className="text-right">
                          <div className="text-xl font-bold leading-none">{date.day}</div>
                          <div className="text-xs font-medium text-muted-foreground mt-1">
                            {date.month} {date.year}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Title and Type */}
                    <div className="flex-1">
                      <h2 className={`text-xl md:text-2xl font-light tracking-tight transition-all duration-300 ${
                        isHovered ? 'translate-x-2' : ''
                      }`}>
                        {event.title}
                      </h2>
                      {event.event_type && (
                        <span className={`text-xs font-medium uppercase tracking-wider mt-1 inline-block ${getEventTypeColor(event.event_type)}`}>
                          {event.event_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side - Arrow */}
                  <div className={`transition-all duration-300 ${
                    isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      <div className="w-full px-6 py-12">
        {/* Header */}
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 flex items-end justify-between"
          >
            <div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-3">
                ART<span className="text-gray-400 dark:text-gray-600">.</span>EVENTS
              </h1>
              <p className="text-base text-muted-foreground max-w-xl">
                Explore contemporary art exhibitions, research projects, and curatorial initiatives
              </p>
            </div>
            
            {/* View Toggle */}
            <button
              onClick={() => setView(view === 'split' ? 'list' : 'split')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <SquareChartGantt className="w-4 h-4" />
              <span>{view === 'split' ? 'Hide Timeline' : 'Show Timeline'}</span>
            </button>
          </motion.div>
        </div>

        {/* Content */}
        {view === 'split' ? (
          <div className="flex gap-12">
            {/* Left - Events List */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-1/2 max-w-3xl mx-auto"
            >
              <div className="mb-6">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Upcoming & Current
                </h2>
              </div>
              {eventsList}
            </motion.div>

            {/* Right - Gantt Chart */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-1/2 sticky top-20 h-[calc(100vh-10rem)]"
            >
              <div>
                 <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                   Timeline View
                 </h2>
               </div>
                             <div className="h-full rounded-lg overflow-hidden">
                 <GanttChart events={events} highlightedEventId={hoveredEvent} />
               </div>
            </motion.div>
          </div>
        ) : (
          <div className="container mx-auto max-w-4xl">
            {eventsList}
          </div>
        )}

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="container mx-auto mt-32 pt-16 border-t border-gray-200 dark:border-gray-800"
        >
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Art Events Platform. Curating digital exhibitions.
          </p>
        </motion.div>
      </div>
    </main>
  );
} 