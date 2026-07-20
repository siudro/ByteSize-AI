import { notFound } from "next/navigation";
import { ByteRenderer } from "@/components/ByteRenderer";
import { ExperienceProvider } from "@/components/ExperienceProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ProgressProvider } from "@/components/ProgressProvider";
import { getByteById, getByteIds } from "@/lib/bytes";
import { getPlaceholderByte } from "@/lib/placeholderBytes";

type BytePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getByteIds().map((id) => ({ id }));
}

export default async function BytePage({ params }: BytePageProps) {
  const { id } = await params;
  const byte = getByteById(id) ?? getPlaceholderByte(id);

  if (!byte) {
    notFound();
  }

  return (
    <LanguageProvider>
      <ExperienceProvider>
        <ProgressProvider>
          <ByteRenderer byte={byte} />
        </ProgressProvider>
      </ExperienceProvider>
    </LanguageProvider>
  );
}
