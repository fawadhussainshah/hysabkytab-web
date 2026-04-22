type BrandLogoProps = {
  className?: string;
};

/** Brand mark from design 2 (`public/brand-logo.jpg`). */
export function BrandLogo({ className }: BrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand-logo.jpg"
      alt="HysabKytab"
      width={512}
      height={512}
      className={className}
    />
  );
}
