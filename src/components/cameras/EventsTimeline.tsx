export type CameraEventItem = {
  id: string;
  tsUtc: string;
  type: "recognized" | "unknown" | "status" | "incident";
  title: string;
  description?: string;
};

export function EventsTimeline({ items }: { items: CameraEventItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((e) => (
        <div key={e.id} className="p-3 rounded bg-muted/30">
          <div className="flex justify-between gap-2">
            <div className="font-semibold">{e.title}</div>
            <div className="text-xs text-muted-foreground">{new Date(e.tsUtc).toLocaleString()}</div>
          </div>
          {e.description && <div className="text-sm text-muted-foreground mt-1">{e.description}</div>}
          <div className="text-[10px] text-muted-foreground mt-2">Type: {e.type}</div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-sm text-muted-foreground">No events yet.</div>
      )}
    </div>
  );
}
