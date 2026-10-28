import Link from "@/components/loading-link";

export default function BrandLogo({ href = "/" }) {
  return (
    <Link href={href} className="brand-logo" aria-label="SmashMate">
      <strong>SmashMate</strong>
    </Link>
  );
}
