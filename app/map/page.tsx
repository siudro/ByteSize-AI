import { ByteMap } from "@/components/ByteMap";
import { ExperienceProvider } from "@/components/ExperienceProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ProgressProvider } from "@/components/ProgressProvider";
import { getAllBytes } from "@/lib/bytes";
import { PLACEHOLDER_BYTE_SUMMARIES } from "@/lib/placeholderBytes";

export default function MapPage() {
  const bytes = [...getAllBytes(), ...PLACEHOLDER_BYTE_SUMMARIES];

  return (
    <LanguageProvider>
      <ExperienceProvider>
        <ProgressProvider>
          <ByteMap bytes={bytes} />
        </ProgressProvider>
      </ExperienceProvider>
    </LanguageProvider>
  );
}
