interface ImageCardProps {
  url: string;
  alt?: string;
  className?: string;
}

export function ImageCard({ url, alt, className }: ImageCardProps) {
  return (
    <div className={`relative overflow-hidden group ${className}`}>
      <img
        src={url}
        alt={alt || "Fotografi Myelie Lendelund"}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      {/* Subtle overlay that appears on hover */}
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}