import { useRef, useEffect, type ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TimelineItem } from "./timeline-item";

type Severity = "critical" | "high" | "medium" | "low" | "info" | "default";

export interface FeedEvent {
  id: string;
  severity: Severity;
  icon?: ElementType;
  title: string;
  description?: string;
  time: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

interface EventFeedProps {
  events: FeedEvent[];
  maxHeight?: number | string;
  className?: string;
  autoScroll?: boolean;
  emptyLabel?: string;
  compact?: boolean;
}

export function EventFeed({ events, maxHeight = 400, className, autoScroll = true, emptyLabel = "No events yet", compact = false }: EventFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoScroll || !bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length, autoScroll]);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-y-auto scrollbar-thin space-y-1 pr-1", className)}
      style={{ maxHeight }}
    >
      {events.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          {emptyLabel}
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <TimelineItem
                icon={event.icon}
                severity={event.severity}
                title={event.title}
                description={event.description}
                time={event.time}
                badge={event.badge}
                actions={event.actions}
                compact={compact}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
