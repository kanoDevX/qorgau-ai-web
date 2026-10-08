import { CertificateCheck } from "@/components/verify/certificate-check";

export default function VerifyIndexPage() {
  return (
    <div className="bg-[var(--bg)]">
      <CertificateCheck serial="" />
    </div>
  );
}
