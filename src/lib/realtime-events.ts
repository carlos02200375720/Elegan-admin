export type EleganRealtimeEvent = {
  type: "data_changed";
  collection: string;
  operation?: string;
  documentId?: string;
};

export function subscribeRealtime(
  collections: string[],
  onChange: (event: EleganRealtimeEvent) => void
): () => void {
  const accepted = new Set(collections);
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<EleganRealtimeEvent>).detail;
    if (detail && accepted.has(detail.collection)) onChange(detail);
  };
  window.addEventListener("elegan:realtime", handler);
  return () => window.removeEventListener("elegan:realtime", handler);
}
