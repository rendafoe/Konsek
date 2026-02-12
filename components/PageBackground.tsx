"use client";

interface PageBackgroundProps {
  src: string;
  overlay?: number;
  children: React.ReactNode;
}

export function PageBackground({ src, overlay = 0.3, children }: PageBackgroundProps) {
  return (
    <div className="relative min-h-full">
      <img
        src={src}
        alt=""
        className="fixed inset-0 w-full h-full object-cover z-0"
        draggable={false}
      />
      {overlay > 0 && (
        <div
          className="fixed inset-0 z-0"
          style={{ backgroundColor: `rgba(0, 0, 0, ${overlay})` }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
