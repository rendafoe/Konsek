"use client";

import { useCharacterArchive } from "@/hooks/use-character";
import { Loader2, Skull } from "lucide-react";
import { format } from "date-fns";
import { getEskoStage, getEskoImage } from "@/components/EskoCharacter";
import { useDistanceUnit } from "@/hooks/use-distance-unit";
import { PageBackground } from "@/components/PageBackground";

export default function Archive() {
  const { data: graveyard, isLoading } = useCharacterArchive();
  const { formatDistance } = useDistanceUnit();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageBackground src="/backgrounds/graveyard.webp" overlay={0.25}>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {graveyard?.map((char, i) => {
            const stageInfo = getEskoStage(char.totalRuns);
            const eskoImg = getEskoImage(stageInfo.stage);
            return (
              <div
                key={char.id}
                className="tombstone-card group"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Greyed Esko image */}
                <div className="relative flex justify-center pt-3 pb-1">
                  <img
                    src={eskoImg}
                    alt={`${char.name} - ${stageInfo.name}`}
                    className="w-16 h-16 object-contain grayscale opacity-50 group-hover:opacity-70 transition-opacity duration-300"
                  />
                </div>

                {/* Name */}
                <h3 className="font-pixel text-[11px] text-center text-stone-300 truncate px-2">
                  {char.name}
                </h3>

                {/* Divider */}
                <div className="mx-3 my-1.5 border-t border-stone-600/40" />

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 px-3 pb-2 text-center">
                  <div>
                    <span className="block text-[8px] font-pixel uppercase text-stone-500">
                      Lived
                    </span>
                    <span className="text-[11px] font-semibold text-stone-300">
                      {char.daysAlive}d
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-pixel uppercase text-stone-500">
                      Ran
                    </span>
                    <span className="text-[11px] font-semibold text-stone-300">
                      {formatDistance(char.totalDistance)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-pixel uppercase text-stone-500">
                      Runs
                    </span>
                    <span className="text-[11px] font-semibold text-stone-300">
                      {char.totalRuns}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-pixel uppercase text-stone-500">
                      Stage
                    </span>
                    <span className="text-[11px] font-semibold text-stone-300">
                      {stageInfo.name}
                    </span>
                  </div>
                </div>

                {/* Death date */}
                <div className="px-3 pb-3 text-center">
                  <span className="text-[9px] text-stone-500 italic">
                    {char.deathDate
                      ? format(new Date(char.deathDate), "MMM d, yyyy")
                      : "Date unknown"}
                  </span>
                </div>
              </div>
            );
          })}

          {graveyard?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-32">
              <Skull className="w-10 h-10 text-stone-500 mb-3 opacity-40" />
              <p className="font-pixel text-sm text-stone-400">
                No souls rest here yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </PageBackground>
  );
}
