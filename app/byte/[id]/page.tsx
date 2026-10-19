import { notFound } from "next/navigation";
import { ByteRenderer } from "@/components/ByteRenderer";
import { ExperienceProvider } from "@/components/ExperienceProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ProgressProvider } from "@/components/ProgressProvider";
import { getByteById, getByteIds } from "@/lib/bytes";
import { getPlaceholderByte, PLACEHOLDER_BYTES } from "@/lib/placeholderBytes";

type BytePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return [...new Set([...getByteIds(), ...PLACEHOLDER_BYTES.map((byte) => byte.id)])].map((id) => ({ id }));
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
