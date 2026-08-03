import type { Byte, MediaKind, MediaReference } from "./schema";

export function getMediaIndex(byte: Byte): Record<string, MediaReference & { type: MediaKind }> {
  const media = byte.media ?? {};
  const groups: Array<[MediaKind, MediaReference[] | undefined]> = [
    ["image", media.images],
    ["video", media.videos],
    ["audio", media.audio],
    ["download", media.downloads]
  ];

  return groups.reduce<Record<string, MediaReference & { type: MediaKind }>>((index, [type, items]) => {
    for (const item of items ?? []) {
      index[item.id] = { ...item, type };
    }
    return index;
  }, {});
}

export function getVisualization(byte: Byte, id?: string | null) {
  if (!id) return undefined;
  return byte.tools?.internal_visualizations?.find((item) => {
    const componentKey = (item as { component_key?: unknown }).component_key;
    return item.id === id || (typeof componentKey === "string" && componentKey === id);
  });
}
