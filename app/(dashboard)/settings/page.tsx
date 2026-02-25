"use client";

import { useStravaStatus } from "@/hooks/use-strava";
import { useAuth } from "@/hooks/use-auth";
import { useReferralStats } from "@/hooks/use-referrals";
import { useHaptics } from "@/hooks/use-haptics";
import { signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  LogOut,
  Volume2,
  Vibrate,
  RefreshCw,
  AlertTriangle,
  Send,
  ImagePlus,
  X,
  CheckCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { PageBackground } from "@/components/PageBackground";

function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (images.length === 0) {
      setPreviews([]);
      return;
    }
    const newPreviews: string[] = new Array(images.length).fill("");
    let pending = images.length;
    images.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews[i] = e.target?.result as string;
        pending--;
        if (pending === 0) setPreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
  }, [images]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files].slice(0, 3));
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!message.trim() || status === "loading") return;
    setStatus("loading");

    const formData = new FormData();
    formData.append("message", message.trim());
    images.forEach((img) => formData.append("images", img));

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setMessage("");
      setImages([]);
      setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle size={28} className="text-green-500" />
        <p className="font-semibold text-sm">Thanks for the feedback!</p>
        <p className="text-xs text-muted-foreground">Your report has been sent.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Found a bug or have a suggestion? Let us know.
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe the issue or your feedback..."
        rows={4}
        className="w-full p-3 text-sm bg-muted/30 border border-border rounded-lg resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {previews.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative group">
              <img
                src={src}
                alt={`Screenshot ${i + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-border"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-center">
        {images.length < 3 && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ImagePlus size={14} />
              {images.length > 0 ? `${images.length}/3 screenshots` : "Add Screenshot"}
            </button>
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={!message.trim() || status === "loading"}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto"
        >
          {status === "loading" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Submit
        </button>
      </div>

      {status === "error" && (
        <p className="text-xs text-destructive">Failed to send. Please try again.</p>
      )}
    </div>
  );
}

export default function Settings() {
  const { data: stravaStatus, isLoading } = useStravaStatus();
  const { user, logout } = useAuth();
  const { data: referralStats } = useReferralStats();
  const { prefs, toggleSound, toggleHaptics } = useHaptics();
  const supportsVibration = typeof navigator !== "undefined" && "vibrate" in navigator;

  return (
    <PageBackground src="/backgrounds/settings.webp" overlay={0.25}>
    <main className="flex-1 p-4 md:p-8">

      <div className="max-w-xl space-y-8">
        {/* Account Section */}
        <section className="cozy-card p-5">
          <h2 className="font-pixel text-sm uppercase mb-4 text-muted-foreground">Account</h2>
          <div className="flex items-center gap-4 mb-6">
            {user?.image && (
              <img src={user.image} alt="Profile" className="w-12 h-12 rounded-lg border border-border" />
            )}
            <div>
              <p className="font-bold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="cozy-card p-5">
          <h2 className="font-pixel text-sm uppercase mb-4 text-muted-foreground">Integrations</h2>

          <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Strava</h3>
                <p className="text-xs text-muted-foreground">Sync your runs automatically</p>
              </div>
              {isLoading ? (
                <Loader2 className="animate-spin text-muted-foreground" size={16} />
              ) : (
                <span className="text-xs text-green-600 font-bold uppercase">Connected</span>
              )}
            </div>

            {!isLoading && stravaStatus?.isConnected && !stravaStatus.hasFullAccess && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Missing permissions to sync followers-only or private activities. Reconnect to fix.
                </p>
              </div>
            )}

            {!isLoading && stravaStatus?.isConnected && (
              <button
                onClick={() => signIn("strava", { callbackUrl: "/settings" }, { approval_prompt: "force" })}
                className="flex items-center justify-center gap-2 w-full p-2 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <RefreshCw size={12} />
                Reconnect Strava
              </button>
            )}
          </div>
        </section>

        {/* Referral Section */}
        <section className="cozy-card p-5">
          <h2 className="font-pixel text-sm uppercase mb-4 text-muted-foreground">Referral</h2>
          <div className="p-4 bg-muted/30 rounded-lg">
            {referralStats?.referredBy ? (
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Referred by {referralStats.referredBy.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(referralStats.referredBy.date).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not referred by anyone</p>
            )}
          </div>
        </section>

        {/* Preferences Section */}
        <section className="cozy-card p-5">
          <h2 className="font-pixel text-sm uppercase mb-4 text-muted-foreground">Preferences</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Volume2 size={18} className="text-muted-foreground" />
                <div>
                  <h3 className="font-bold text-sm">Sound Effects</h3>
                  <p className="text-xs text-muted-foreground">Play sounds on interactions</p>
                </div>
              </div>
              <Switch checked={prefs.soundEnabled} onCheckedChange={toggleSound} />
            </div>

            {supportsVibration && (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Vibrate size={18} className="text-muted-foreground" />
                  <div>
                    <h3 className="font-bold text-sm">Haptic Feedback</h3>
                    <p className="text-xs text-muted-foreground">Vibrate on interactions</p>
                  </div>
                </div>
                <Switch checked={prefs.hapticsEnabled} onCheckedChange={toggleHaptics} />
              </div>
            )}
          </div>
        </section>

        {/* Feedback & Bug Report */}
        <section className="cozy-card p-5">
          <h2 className="font-pixel text-sm uppercase mb-4 text-muted-foreground">
            Feedback & Bug Report
          </h2>
          <FeedbackForm />
        </section>

        {/* Sign Out */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-lg text-destructive hover:bg-destructive/10 transition-colors font-semibold text-sm"
        >
          <LogOut size={16} />
          Sign Out
        </button>

        <div className="text-xs text-muted-foreground text-center pt-4">
          v1.0.0 • Running Companion
        </div>
      </div>
    </main>
    </PageBackground>
  );
}
