"use client";

import { createContext, useContext, useCallback, useRef } from "react";
import { useStravaSync } from "@/hooks/use-strava";
import { useToast } from "@/hooks/use-toast";

type SyncSuccessHandler = (data: any) => void;

interface SyncContextValue {
  sync: () => void;
  isSyncing: boolean;
  registerSyncHandler: (handler: SyncSuccessHandler) => () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { mutate: syncStrava, isPending: isSyncing } = useStravaSync();
  const { toast } = useToast();
  const handlerRef = useRef<SyncSuccessHandler | null>(null);

  const registerSyncHandler = useCallback((handler: SyncSuccessHandler) => {
    handlerRef.current = handler;
    return () => {
      if (handlerRef.current === handler) {
        handlerRef.current = null;
      }
    };
  }, []);

  const sync = useCallback(() => {
    syncStrava(undefined, {
      onSuccess: (data) => {
        if (handlerRef.current) {
          handlerRef.current(data);
        } else {
          toast({ title: "Sync Complete", description: data.message });
        }
      },
      onError: (err) => {
        toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
      },
    });
  }, [syncStrava, toast]);

  return (
    <SyncContext.Provider value={{ sync, isSyncing, registerSyncHandler }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSyncContext must be used within SyncProvider");
  return ctx;
}
