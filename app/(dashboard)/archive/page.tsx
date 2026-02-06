"use client";

import { useCharacterArchive } from "@/hooks/use-character";
import { PageHeader } from "@/components/PageHeader";
import { Loader2, Skull } from "lucide-react";
import { format } from "date-fns";
import { getEskoStage } from "@/components/EskoCharacter";

export default function Archive() {
  const { data: graveyard, isLoading } = useCharacterArchive();

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <main className="flex-1 p-6 md:p-12 mb-20 md:mb-0 overflow-y-auto">
      <PageHeader title="The Graveyard" subtitle="Past companions who have completed their journey" />

      <div className="grid gap-6">
        {graveyard?.map((char) => {
          const stageInfo = getEskoStage(char.totalRuns);
          return (
            <div key={char.id} className="bg-card pixel-border p-6 flex flex-col md:flex-row items-center gap-8 opacity-80 hover:opacity-100 transition-opacity">
              <div className="w-24 h-24 bg-stone-200 border-4 border-stone-400 rounded-xl flex flex-col items-center justify-center grayscale">
                <div className="text-2xl mb-1">🪦</div>
                <div className="font-pixel text-xs text-stone-600">{stageInfo.name}</div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-pixel mb-2">{char.name}</h3>
                <div className="text-sm text-muted-foreground grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-pixel uppercase">Lived</span>
                    <span className="font-bold">{char.daysAlive} Days</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-pixel uppercase">Ran</span>
                    <span className="font-bold">{Math.round(char.totalDistance / 1000)} km</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-pixel uppercase">Total Runs</span>
                    <span className="font-bold">{char.totalRuns}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-pixel uppercase">Final Stage</span>
                    <span className="font-bold">{stageInfo.name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-pixel uppercase">Passed Away</span>
                    <span className="font-bold">{char.deathDate ? format(new Date(char.deathDate), "MMMM d, yyyy") : "Unknown"}</span>
                  </div>
                </div>
              </div>

              <div className="opacity-20">
                <Skull size={48} />
              </div>
            </div>
          );
        })}

        {graveyard?.length === 0 && (
          <div className="text-center py-20 bg-card/30 rounded-lg">
            <p className="font-pixel text-muted-foreground">No souls rest here yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
