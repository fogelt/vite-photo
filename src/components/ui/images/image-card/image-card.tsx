interface ImageCardProps {
  url: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function ImageCard({ url, alt, className, style, onClick }: ImageCardProps) {
  return (
    <div
      className={`relative overflow-hidden group ${className}`}
      onClick={onClick}
      style={style}
    >
      <img
        src={url}
        alt={alt || "Fotografi Myelie Lendelund"}
        className="h-full w-full object-cover object-[center_25%] transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}