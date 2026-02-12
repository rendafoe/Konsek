"use client";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-6 bg-card/70 backdrop-blur-sm rounded-xl px-5 py-4 border border-border/50 w-fit">
      <h1 className="text-2xl font-bold text-card-foreground">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </header>
  );
}
