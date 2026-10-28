import Link from "@/components/loading-link";
import Image from "next/image";

export default function BrandLogo({ href = "/" }) {
  return (
    <Link href={href} className="brand-logo" aria-label="SmashMate">
      <Image src="/icon.svg" alt="" width={32} height={32} unoptimized className="brand-mark" />
      <strong>SmashMate</strong>
    </Link>
  );
}
