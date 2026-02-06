import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="bg-card p-8 pixel-border max-w-md w-full text-center">
        <AlertTriangle className="w-16 h-16 text-accent mx-auto mb-6" />
        <h1 className="text-4xl font-pixel mb-4">404</h1>
        <p className="text-muted-foreground mb-8">
          The path you seek has not been generated yet. It may be lost to the void.
        </p>
        <Link href="/" className="pixel-btn-primary inline-block">
          Return Home
        </Link>
      </div>
    </div>
  );
}
