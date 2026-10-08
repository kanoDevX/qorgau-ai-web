import { CertificateCheck } from "@/components/verify/certificate-check";

export default async function VerifyPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  return (
    <div className="bg-[var(--bg)]">
      <CertificateCheck serial={decodeURIComponent(serial).trim().toUpperCase()} />
    </div>
  );
}
