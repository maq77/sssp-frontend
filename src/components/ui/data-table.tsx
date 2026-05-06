import { useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  loading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number | null;
  className?: string;
  stickyHeader?: boolean;
  compact?: boolean;
}

function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  if (direction === "asc")  return <ChevronUp className="w-3 h-3" />;
  if (direction === "desc") return <ChevronDown className="w-3 h-3" />;
  return <ChevronsUpDown className="w-3 h-3 opacity-30" />;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted/40 rounded animate-pulse" style={{ width: `${60 + (i * 13) % 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyState,
  onRowClick,
  selectedKey,
  className,
  stickyHeader = true,
  compact = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey];
        const bv = (b as Record<string, unknown>)[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  const rowPy = compact ? "py-2" : "py-3";

  return (
    <div className={cn("w-full overflow-auto rounded-xl border border-border/60", className)}>
      <table className="w-full text-sm border-collapse">
        <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
          <tr className="border-b border-border/60 bg-surface-2">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none whitespace-nowrap",
                  col.align === "center" && "text-center",
                  col.align === "right"  && "text-right",
                  col.sortable && "cursor-pointer hover:text-foreground transition-colors"
                )}
                style={{ width: col.width }}
                onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
              >
                <div className={cn("flex items-center gap-1", col.align === "center" && "justify-center", col.align === "right" && "justify-end")}>
                  {col.header}
                  {col.sortable && <SortIcon direction={sortKey === String(col.key) ? sortDir : null} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
            : sorted.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                    {emptyState ?? "No data found"}
                  </td>
                </tr>
              )
              : sorted.map((row, idx) => {
                  const key = keyExtractor(row, idx);
                  const isSelected = selectedKey != null && key === selectedKey;
                  return (
                    <tr
                      key={key}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        "border-b border-border/30 transition-colors",
                        onRowClick && "cursor-pointer",
                        isSelected ? "bg-primary/10" : "hover:bg-white/[0.025]",
                      )}
                    >
                      {columns.map((col) => (
                        <td
                          key={String(col.key)}
                          className={cn(
                            "px-4 text-foreground/90",
                            rowPy,
                            col.align === "center" && "text-center",
                            col.align === "right"  && "text-right",
                          )}
                        >
                          {col.render
                            ? col.render(row, idx)
                            : String((row as Record<string, unknown>)[String(col.key)] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  );
                })
          }
        </tbody>
      </table>
    </div>
  );
}
