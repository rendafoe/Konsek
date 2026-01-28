import { useCharacterArchive } from "@/hooks/use-character";
import { Navigation } from "@/components/Navigation";
import { Loader2, Skull } from "lucide-react";
import { format } from "date-fns";
import { PixelCharacter } from "@/components/PixelCharacter";

export default function Archive() {
  const { data: graveyard, isLoading } = useCharacterArchive();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-ui">
      <Navigation />
      
      <main className="flex-1 p-6 md:p-12 mb-20 md:mb-0 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-2xl md:text-3xl font-pixel text-foreground mb-2">The Graveyard</h1>
          <p className="text-muted-foreground">Past companions who have completed their journey.</p>
        </header>

        <div className="grid gap-6">
          {graveyard?.map((char) => (
             <div key={char.id} className="bg-card pixel-border p-6 flex flex-col md:flex-row items-center gap-8 opacity-80 hover:opacity-100 transition-opacity">
               <div className="grayscale">
                  <PixelCharacter healthState={4} status="dead" scale={1.5} />
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
          ))}

          {graveyard?.length === 0 && (
            <div className="text-center py-20 bg-card/30 rounded-lg">
               <p className="font-pixel text-muted-foreground">No souls rest here yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
