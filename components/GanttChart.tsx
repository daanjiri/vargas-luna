'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { FlowData } from '@/lib/aws/dynamodb';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';

interface GanttChartProps {
  events: FlowData[];
}

// Function to get theme-aware colors
const getThemeColors = (isDark: boolean) => ({
  gridLines: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 0.8)', // pure white in dark mode, strong black in light mode
  gridOpacity: isDark ? 0.7 : 0.7, // high opacity for maximum visibility
  axisText: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)', // pure white/black text
  headerText: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)', // maximum contrast
  emptyStateText: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
  tooltipBg: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.98)',
  tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
  tooltipText: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
  tooltipSubText: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
  tooltipLabelText: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'
});

const eventTypeColors = {
  exhibition: {
    bg: 'rgba(244, 114, 182, 0.2)', // Pink with transparency
    border: 'rgba(244, 114, 182, 0.8)',
    getText: (isDark: boolean) => isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(31, 41, 55, 0.9)'
  },
  research: {
    bg: 'rgba(96, 165, 250, 0.2)', // Blue with transparency
    border: 'rgba(96, 165, 250, 0.8)',
    getText: (isDark: boolean) => isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(31, 41, 55, 0.9)'
  },
  curation: {
    bg: 'rgba(74, 222, 128, 0.2)', // Green with transparency
    border: 'rgba(74, 222, 128, 0.8)',
    getText: (isDark: boolean) => isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(31, 41, 55, 0.9)'
  },
  default: {
    bg: 'rgba(156, 163, 175, 0.2)', // Gray with transparency
    border: 'rgba(156, 163, 175, 0.8)',
    getText: (isDark: boolean) => isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(31, 41, 55, 0.9)'
  }
};

interface Lane {
  events: FlowData[];
  endTime: number;
}

function assignToLanes(events: FlowData[]): FlowData[][] {
    const lanes: Lane[] = [];
    const sortedEvents = [...events].sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());

    sortedEvents.forEach(event => {
        let placed = false;
        for (const lane of lanes) {
            if (new Date(event.start_date!).getTime() >= lane.endTime) {
                lane.events.push(event);
                lane.endTime = new Date(event.end_date!).getTime();
                placed = true;
                break;
            }
        }
        if (!placed) {
            lanes.push({
                events: [event],
                endTime: new Date(event.end_date!).getTime()
            });
        }
    });

    return lanes.map(lane => lane.events);
}

export function GanttChart({ events }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Determine if we're in dark mode
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'system') {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        setIsDark(theme === 'dark');
      }
    };

    updateTheme();
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  // Handle responsive sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Calculate available height (viewport - header - padding)
        const headerHeight = 64; // Navigation height
        const paddingHeight = 120; // Top and bottom padding
        const toggleHeight = 50; // Toggle group height
        const availableHeight = window.innerHeight - headerHeight - paddingHeight - toggleHeight;
        
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: Math.max(400, Math.min(availableHeight, 800))
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!events || !svgRef.current) return;

    const filteredEvents = events.filter(d => d.start_date && d.end_date);
    const themeColors = getThemeColors(isDark);
    
    if (filteredEvents.length === 0) {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        
        // Create empty state
        const emptyGroup = svg.append("g")
            .attr("transform", `translate(${dimensions.width / 2}, ${dimensions.height / 2})`);
            
        emptyGroup.append("text")
           .attr("text-anchor", "middle")
           .style("fill", themeColors.emptyStateText)
           .style("font-size", "16px")
           .text("No events with dates to display");
           
        return;
    }

    const lanes = assignToLanes(filteredEvents);
    const laneCount = lanes.length;

    const margin = { top: 60, right: 20, bottom: 60, left: 20 };
    const width = dimensions.width - margin.left - margin.right;
    const barHeight = 45;
    const barPadding = 15;
    
    // Calculate height to fit within viewport
    const contentHeight = laneCount * (barHeight + barPadding);
    const height = Math.min(dimensions.height, contentHeight + margin.top + margin.bottom);

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', height)
      .style('font-family', 'inherit');

    svg.selectAll("*").remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const minDate = d3.min(filteredEvents, d => new Date(d.start_date!))!;
    const maxDate = d3.max(filteredEvents, d => new Date(d.end_date!))!;
    
    // Add padding to the time scale
    const timePadding = (maxDate.getTime() - minDate.getTime()) * 0.05;
    const paddedMinDate = new Date(minDate.getTime() - timePadding);
    const paddedMaxDate = new Date(maxDate.getTime() + timePadding);

    const xScale = d3.scaleTime()
      .domain([paddedMinDate, paddedMaxDate])
      .range([0, width]);

    // Grid lines
    const yearDiff = paddedMaxDate.getFullYear() - paddedMinDate.getFullYear();
    const tickInterval = yearDiff > 50 ? 10 : yearDiff > 20 ? 5 : yearDiff > 10 ? 2 : 1;
    
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeYear.every(tickInterval))
      .tickSize(-contentHeight)
      .tickFormat(d => d3.timeFormat('%Y')(d as Date));

    g.append('g')
      .attr('transform', `translate(0, ${contentHeight})`)
      .attr('class', 'grid')
      .style('stroke-dasharray', '3,3')
      .style('opacity', themeColors.gridOpacity)
      .call(xAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').style('stroke', themeColors.gridLines))
      .call(g => g.selectAll('.tick text')
        .style('font-size', '12px')
        .style('fill', themeColors.axisText)
        .attr('y', 15));

    // Timeline header
    svg.append('text')
      .attr('x', margin.left)
      .attr('y', 30)
      .style('font-size', '14px')
      .style('font-weight', '500')
      .style('fill', themeColors.headerText)
      .text(`Timeline: ${paddedMinDate.getFullYear()} - ${paddedMaxDate.getFullYear()}`);

    lanes.forEach((lane, laneIndex) => {
        const laneGroup = g.append('g')
          .attr('transform', `translate(0, ${laneIndex * (barHeight + barPadding)})`);

        lane.forEach(event => {
            const eventGroup = laneGroup.append('g')
              .style('cursor', 'pointer')
              .on('mouseenter', function(e) {
                setHoveredEvent(event.flow_id);
                const [x, y] = d3.pointer(e, svg.node());
                setMousePosition({ x, y });
                d3.select(this).select('.main-bar')
                  .style('fill', eventTypeColors[event.event_type || 'default'].bg.replace('0.2', '0.3'))
                  .style('filter', 'brightness(1.2)');
              })
              .on('mouseleave', function() {
                setHoveredEvent(null);
                d3.select(this).select('.main-bar')
                  .style('fill', eventTypeColors[event.event_type || 'default'].bg)
                  .style('filter', 'none');
              })
              .on('click', () => router.push(`/flow/${event.flow_id}`));

            const barX = xScale(new Date(event.start_date!));
            const barWidth = Math.max(30, xScale(new Date(event.end_date!)) - barX);
            const colors = eventTypeColors[event.event_type || 'default'];

            // Glow effect
            eventGroup.append('rect')
              .attr('x', barX - 2)
              .attr('y', -2)
              .attr('width', barWidth + 4)
              .attr('height', barHeight + 4)
              .attr('fill', 'none')
              .attr('stroke', colors.border)
              .attr('stroke-width', 1)
              .attr('opacity', 0.3)
              .attr('rx', 10)
              .attr('ry', 10)
              .style('filter', 'blur(4px)');

            // Main bar
            eventGroup.append('rect')
              .attr('class', 'main-bar')
              .attr('x', barX)
              .attr('y', 0)
              .attr('width', barWidth)
              .attr('height', barHeight)
              .attr('fill', colors.bg)
              .attr('stroke', colors.border)
              .attr('stroke-width', 2)
              .attr('rx', 8)
              .attr('ry', 8)
              .style('backdrop-filter', 'blur(10px)')
              .style('transition', 'all 0.3s ease');

            // Truncated title
            const maxTextWidth = barWidth - 20;
            eventGroup.append('text')
              .attr('x', barX + 15)
              .attr('y', barHeight / 2 + 5)
              .style('fill', colors.getText(isDark))
              .style('font-weight', '500')
              .style('font-size', '14px')
              .style('pointer-events', 'none')
              .style('text-shadow', isDark ? '0 0 10px rgba(0, 0, 0, 0.5)' : '0 0 10px rgba(255, 255, 255, 0.5)')
              .text(event.title)
              .each(function() {
                const self = d3.select(this);
                let textLength = (this as SVGTextElement).getComputedTextLength();
                let text = event.title;
                while (textLength > maxTextWidth && text.length > 0) {
                  text = text.slice(0, -1);
                  self.text(text + '...');
                  textLength = (this as SVGTextElement).getComputedTextLength();
                }
              });
        });
    });

  }, [events, router, dimensions, isDark]);

  // Tooltip
  const tooltipEvent = events.find(e => e.flow_id === hoveredEvent);
  const themeColors = getThemeColors(isDark);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef}></svg>
      
      {tooltipEvent && (
        <div 
          className="absolute z-50 p-3 rounded-lg shadow-2xl text-sm pointer-events-none backdrop-blur-md"
          style={{ 
            left: `${Math.min(mousePosition.x + 10, dimensions.width - 250)}px`, 
            top: `${mousePosition.y - 60}px`,
            maxWidth: '250px',
            background: themeColors.tooltipBg,
            border: `1px solid ${themeColors.tooltipBorder}`,
            color: themeColors.tooltipText
          }}
        >
          <div className="font-semibold mb-1">{tooltipEvent.title}</div>
          {tooltipEvent.description && (
            <div className="text-xs mb-2 line-clamp-2" style={{ color: themeColors.tooltipSubText }}>
              {tooltipEvent.description}
            </div>
          )}
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span style={{ color: themeColors.tooltipLabelText }}>Type:</span>
              <span className="capitalize font-medium">{tooltipEvent.event_type || 'Exhibition'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: themeColors.tooltipLabelText }}>Duration:</span>
              <span>{new Date(tooltipEvent.start_date!).getFullYear()} - {new Date(tooltipEvent.end_date!).getFullYear()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 