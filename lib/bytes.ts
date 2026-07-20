import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type { Byte, ByteScreen, ByteSummary, LocalizedText } from "./schema";

const BYTES_ROOT = path.join(process.cwd(), "content", "bytes");

function warnContent(byte: Byte) {
  if (process.env.NODE_ENV === "production") return;

  for (const screen of byte.screens ?? []) {
    const prefix = `[ByteSize content warning] ${byte.id}/${screen.id}`;
    if ((screen.media?.length ?? 0) > 2) {
      console.warn(`${prefix}: screen has more than 2 media items.`);
    }
    if (screen.type === "media_gallery" && ((screen.items as unknown[])?.length ?? 0) > 3) {
      console.warn(`${prefix}: media_gallery has more than 3 items.`);
    }
    const optionCount = getOptionCount(screen);
    if (optionCount > 4) {
      console.warn(`${prefix}: screen has more than 4 answer options.`);
    }
    for (const [field, value] of localizedFields(screen)) {
      if (value.ar && value.ar.length > 220) {
        console.warn(`${prefix}: Arabic ${field} is longer than 220 characters.`);
      }
      if (value.en && value.en.length > 260) {
        console.warn(`${prefix}: English ${field} is longer than 260 characters.`);
      }
    }
  }
}

function getOptionCount(screen: ByteScreen) {
  if (Array.isArray(screen.options)) return screen.options.length;
  const exercise = screen.exercise;
  if (exercise && Array.isArray(exercise.options)) return exercise.options.length;
  return 0;
}

function localizedFields(screen: ByteScreen): Array<[string, LocalizedText]> {
  const fields = [
    "title",
    "subtitle",
    "content",
    "instruction",
    "prompt",
    "question",
    "what_happened",
    "why_it_matters",
    "where_it_leads"
  ];
  return fields.flatMap((field) => {
    const value = screen[field];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return [[field, value as LocalizedText] as [string, LocalizedText]];
    }
    return [];
  });
}

export function getByteIds(): string[] {
  if (!fs.existsSync(BYTES_ROOT)) return [];
  return fs
    .readdirSync(BYTES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function getByteById(id: string): Byte | null {
  const filePath = path.join(BYTES_ROOT, id, "byte.yaml");
  if (!fs.existsSync(filePath)) return null;
  const source = fs.readFileSync(filePath, "utf8");
  const byte = parse(source) as Byte;
  warnContent(byte);
  return byte;
}

export function getAllBytes(): ByteSummary[] {
  return getByteIds()
    .map(getByteById)
    .filter((byte): byte is Byte => Boolean(byte))
    .map((byte) => ({
      id: byte.id,
      title: byte.title,
      subtitle: byte.subtitle,
      level: byte.level,
      primary_pathway: byte.primary_pathway,
      status: byte.status,
      map: byte.map
    }))
    .sort((a, b) => {
      const levelDiff = a.level - b.level;
      if (levelDiff !== 0) return levelDiff;
      return (a.map?.position?.order ?? 0) - (b.map?.position?.order ?? 0);
    });
}
