interface ImageCardProps {
  url: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onLoad?: () => void;
  has_variant?: React.ReactNode;
}

export function ImageCard({ url, alt, className, style, onClick, onLoad, has_variant }: ImageCardProps) {
  return (
    <div
      className={`relative overflow-hidden group ${className}`}
      onClick={onClick}
      style={style}
    >
      {has_variant && (
        <div
          className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto group/icon"
        >
          <span className="text-white text-xs font-medium bg-black/40 backdrop-blur-md px-2 py-1 rounded-md opacity-0 -translate-x-2 transition-all duration-300 group-hover/icon:opacity-100 group-hover/icon:translate-x-0 whitespace-nowrap">
            Bilden har varianter
          </span>

          <div className="text-white drop-shadow-md bg-black/40 backdrop-blur-md px-1 opacity-25 py-1 rounded-md transition-transform duration-300 group-hover/icon:scale-110 group-hover/icon:opacity-100">
            {has_variant}
          </div>
        </div>
      )}
      <img
        src={url}
        alt={alt || "Fotografi Myelie Lendelund"}
        onLoad={onLoad} // Triggar funktionen i ImageContainer när filen är hämtad
        className="h-full w-full object-cover object-[center_70%] transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}