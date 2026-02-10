"use client";

import { useState, useEffect } from "react";
import {
  useFriends, useDiscoverUsers, useFriendCode,
  useAddFriend, useRemoveFriend,
} from "@/hooks/use-friends";
import { useReferralStats, useReferralList } from "@/hooks/use-referrals";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, Users, Search, Copy, Check, UserPlus, X,
  Crown, Heart, Footprints, Ruler, Award,
  ChevronLeft, ChevronRight, Gift, ExternalLink,
} from "lucide-react";

const rarityTextColors: Record<string, string> = {
  common: "text-gray-500",
  uncommon: "text-green-600",
  rare: "text-blue-600",
  epic: "text-purple-600",
  legendary: "text-yellow-600",
  mythic: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500",
};

const healthLabels = ["Perfect", "Rested", "Weak", "Critical", "Dead"];
const healthColors = ["text-green-600", "text-blue-600", "text-yellow-600", "text-red-600", "text-gray-500"];

// Map display names back to image keys (with hyphens)
const STAGE_DISPLAY_TO_KEY: Record<string, string> = {
  "egg": "Egg",
  "hatchling-v1": "Hatchling",
  "hatchling-v2": "Baby",
  "child": "Child",
  "adolescent": "Adolescent",
  "young-adult": "Young Adult",
  "mature": "Mature",
  "maxed": "Maxed",
};

function getEskoImageUrl(displayName: string): string {
  const entry = Object.entries(STAGE_DISPLAY_TO_KEY).find(([, v]) => v === displayName);
  return entry ? `/esko/esko-${entry[0]}.png` : "/esko/esko-egg.png";
}

function formatCode(code: string): string {
  if (code.length === 8) return `${code.slice(0, 4)}-${code.slice(4)}`;
  return code;
}

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "distance", label: "Distance" },
  { value: "medals", label: "Medals" },
  { value: "runs", label: "Runs" },
  { value: "esko_age", label: "Esko Age" },
] as const;

export default function Friends() {
  const [tab, setTab] = useState<"friends" | "discover">("friends");
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Discover state
  const [discoverPage, setDiscoverPage] = useState(1);
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [discoverSort, setDiscoverSort] = useState("name");

  const { data: friendsData, isLoading: friendsLoading } = useFriends();
  const { data: discoverData, isLoading: discoverLoading } = useDiscoverUsers(discoverPage, debouncedSearch, discoverSort);
  const { data: codeData } = useFriendCode();
  const { mutate: addFriend, isPending: isAdding } = useAddFriend();
  const { mutate: removeFriend } = useRemoveFriend();
  const { data: referralStats } = useReferralStats();
  const { data: referralList } = useReferralList();
  const { toast } = useToast();

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const friends = friendsData?.friends ?? [];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(discoverSearch);
      setDiscoverPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [discoverSearch]);

  const handleCopyCode = () => {
    if (!codeData?.friendCode) return;
    navigator.clipboard.writeText(formatCode(codeData.friendCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddByCode = () => {
    const trimmed = codeInput.trim().replace(/-/g, "");
    if (trimmed.length !== 8) {
      toast({ title: "Invalid Code", description: "Friend code must be 8 characters (XXXX-XXXX)", variant: "destructive" });
      return;
    }
    addFriend({ friendCode: trimmed }, {
      onSuccess: () => {
        toast({ title: "Friend Added!", description: "You are now connected." });
        setCodeInput("");
      },
      onError: (err) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
    });
  };

  const handleAddFromDiscover = (targetUserId: string) => {
    addFriend({ targetUserId }, {
      onSuccess: () => toast({ title: "Friend Added!" }),
      onError: (err) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
    });
  };

  const handleRemoveFriend = (stravaAthleteId: string, name: string) => {
    setRemovingId(stravaAthleteId);
    removeFriend(stravaAthleteId, {
      onSuccess: () => { toast({ title: "Friend Removed", description: `${name} has been removed` }); setRemovingId(null); },
      onError: () => { toast({ title: "Failed", description: "Could not remove friend", variant: "destructive" }); setRemovingId(null); },
    });
  };

  const handleSortChange = (newSort: string) => {
    setDiscoverSort(newSort);
    setDiscoverPage(1);
  };

  const handleCopyInviteLink = () => {
    if (!codeData?.friendCode) {
      toast({ title: "Connect Strava First", description: "You need a friend code to share invite links.", variant: "destructive" });
      return;
    }
    const code = formatCode(codeData.friendCode);
    navigator.clipboard.writeText(`https://konsek.io?ref=${code}`);
    setInviteCopied(true);
    toast({ title: "Invite Link Copied!", description: "Share it with friends to earn medals." });
    setTimeout(() => setInviteCopied(false), 2000);
  };

  if (friendsLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <main className="flex-1 p-6 md:p-12 mb-20 md:mb-0 overflow-y-auto">
      <PageHeader
        title="Friends"
        subtitle={`${friends.length} friend${friends.length !== 1 ? "s" : ""} connected`}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("friends")}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            tab === "friends" ? "bg-primary text-white shadow-md" : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <Users size={16} className="inline mr-2" />
          My Friends
        </button>
        <button
          onClick={() => setTab("discover")}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            tab === "discover" ? "bg-primary text-white shadow-md" : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <Search size={16} className="inline mr-2" />
          Discover
        </button>
      </div>

      {tab === "friends" && (
        <>
          {/* Action Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Your Friend Code */}
            <div className="bg-card p-4 rounded-xl border-2 border-border shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Your Friend Code</h3>
              {codeData?.friendCode ? (
                <div className="flex items-center gap-3">
                  <span className="font-pixel text-lg tracking-widest text-foreground">
                    {formatCode(codeData.friendCode)}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all"
                    title="Copy code"
                  >
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Connect Strava to get a code</span>
              )}
            </div>

            {/* Add a Friend */}
            <div className="bg-card p-4 rounded-xl border-2 border-border shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Add a Friend</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  className="flex-1 px-3 py-2 bg-background border-2 border-border rounded-lg text-sm font-pixel tracking-wider focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleAddByCode}
                  disabled={isAdding || codeInput.replace(/-/g, "").length !== 8}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isAdding ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                </button>
              </div>
            </div>

            {/* Invite a Friend */}
            <div className="bg-card p-4 rounded-xl border-2 border-border shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Invite a Friend</h3>
              <button
                onClick={handleCopyInviteLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold text-sm hover:bg-primary hover:text-white transition-all"
              >
                {inviteCopied ? <Check size={16} /> : <ExternalLink size={16} />}
                {inviteCopied ? "Link Copied!" : "Copy Invite Link"}
              </button>
            </div>

            {/* Referrals Count */}
            <button
              onClick={() => setReferralModalOpen(true)}
              className="bg-card p-4 rounded-xl border-2 border-border shadow-sm text-left hover:border-primary/30 transition-all"
            >
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Referrals</h3>
              <div className="flex items-center gap-2">
                <Gift size={20} className="text-primary" />
                <span className="font-pixel text-lg text-foreground">
                  {referralStats?.totalReferrals ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">
                  friend{(referralStats?.totalReferrals ?? 0) !== 1 ? "s" : ""} referred
                </span>
              </div>
            </button>
          </div>

          {/* Referral List Modal */}
          <Dialog open={referralModalOpen} onOpenChange={setReferralModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-pixel text-sm">Your Referrals</DialogTitle>
              </DialogHeader>
              {!referralList?.referrals || referralList.referrals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Gift className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground text-center">
                    No referrals yet. Share your invite link to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {referralList.referrals.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      {r.referredUserProfilePicture ? (
                        <img
                          src={r.referredUserProfilePicture}
                          alt={r.referredUserName}
                          className="w-8 h-8 rounded-full border border-border object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
                          <Users size={14} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{r.referredUserName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Joined {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs font-semibold text-yellow-700">
                          <img src="/items/medal.png" alt="" className="w-3.5 h-3.5" />
                          {r.medalsEarned}/{r.maxMedals}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">
                      Total earned from referrals: <span className="font-semibold text-yellow-700">{referralStats?.totalMedalsEarned ?? 0} medals</span>
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Friends Grid */}
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-border rounded-lg bg-card/50">
              <Users className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="font-pixel text-sm text-muted-foreground">No Friends Yet</p>
              <p className="text-xs text-muted-foreground mt-2">
                Browse the Discover tab or share your friend code to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div key={friend.stravaAthleteId} className="bg-card rounded-xl border-2 border-border shadow-sm overflow-hidden relative group">
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveFriend(friend.stravaAthleteId, friend.displayName)}
                    disabled={removingId === friend.stravaAthleteId}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-background/80 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all z-10"
                    title="Remove friend"
                  >
                    {removingId === friend.stravaAthleteId ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <X size={14} />
                    )}
                  </button>

                  <div className="p-4">
                    {/* Profile header */}
                    <div className="flex items-center gap-3 mb-3">
                      {friend.profilePicture ? (
                        <img
                          src={friend.profilePicture}
                          alt={friend.displayName}
                          className="w-10 h-10 rounded-full border-2 border-primary/30 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                          <Users size={18} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-pixel text-sm text-foreground truncate">{friend.displayName}</h3>
                        <p className="text-[10px] text-muted-foreground">
                          {friend.source === "code" ? "Added by code" : friend.source === "discover" ? "From Discover" : "From club"} &middot; {new Date(friend.friendSince).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {friend.isKonsekUser ? (
                      <>
                        {/* Esko info */}
                        {friend.eskoStage && (
                          <div className="flex items-center gap-2 mb-3 bg-background rounded-lg p-2">
                            <img
                              src={getEskoImageUrl(friend.eskoStage)}
                              alt={friend.eskoStage}
                              className="w-10 h-10 object-contain"
                            />
                            <div>
                              <p className="text-xs font-semibold text-foreground">{friend.eskoStage}</p>
                              {friend.eskoHealthState !== null && (
                                <p className={`text-[10px] font-semibold ${healthColors[friend.eskoHealthState] ?? "text-gray-500"}`}>
                                  <Heart size={10} className="inline mr-0.5" />
                                  {healthLabels[friend.eskoHealthState] ?? "Unknown"}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-background rounded-lg p-2 text-center">
                            <Footprints size={12} className="mx-auto mb-1 text-muted-foreground" />
                            <p className="text-xs font-bold text-foreground">{friend.totalRuns ?? 0}</p>
                            <p className="text-[9px] text-muted-foreground">Runs</p>
                          </div>
                          <div className="bg-background rounded-lg p-2 text-center">
                            <Ruler size={12} className="mx-auto mb-1 text-muted-foreground" />
                            <p className="text-xs font-bold text-foreground">
                              {friend.totalDistance ? (friend.totalDistance / 1000).toFixed(1) : "0"} km
                            </p>
                            <p className="text-[9px] text-muted-foreground">Distance</p>
                          </div>
                          <div className="bg-background rounded-lg p-2 text-center">
                            <Crown size={12} className="mx-auto mb-1 text-yellow-500" />
                            <p className="text-xs font-bold text-foreground">{friend.totalMedals ?? 0}</p>
                            <p className="text-[9px] text-muted-foreground">Medals</p>
                          </div>
                          <div className="bg-background rounded-lg p-2 text-center">
                            <Award size={12} className="mx-auto mb-1 text-primary" />
                            <p className="text-xs font-bold text-foreground">{friend.totalItemsUnlocked ?? 0}</p>
                            <p className="text-[9px] text-muted-foreground">Items</p>
                          </div>
                        </div>

                        {/* Last item */}
                        {friend.lastItemReceived && (
                          <div className="flex items-center gap-2 bg-background rounded-lg p-2">
                            <img
                              src={friend.lastItemReceived.imageUrl}
                              alt={friend.lastItemReceived.name}
                              className="w-8 h-8 object-contain"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-muted-foreground">Last item</p>
                              <p className="text-xs font-semibold text-foreground truncate">{friend.lastItemReceived.name}</p>
                              <p className={`text-[9px] capitalize font-semibold ${rarityTextColors[friend.lastItemReceived.rarity] || "text-gray-400"}`}>
                                {friend.lastItemReceived.rarity}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-background rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground">Not yet on Konsek</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "discover" && (
        <>
          {/* Search input */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={discoverSearch}
              onChange={(e) => setDiscoverSearch(e.target.value)}
              placeholder="Search by name or friend code..."
              className="w-full pl-10 pr-10 py-2.5 bg-card border-2 border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-all"
            />
            {discoverSearch && (
              <button
                onClick={() => setDiscoverSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort pills */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSortChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  discoverSort === opt.value
                    ? "bg-primary text-white shadow-sm"
                    : "bg-card text-muted-foreground border border-border hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* User list */}
          {discoverLoading && !discoverData ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : !discoverData?.users || discoverData.users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-border rounded-lg bg-card/50">
              <Users className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="font-pixel text-sm text-muted-foreground">
                {debouncedSearch ? "No Users Found" : "No Users to Discover"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {debouncedSearch
                  ? "Try a different search term"
                  : "All Konsek users are already your friends!"}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-card rounded-xl border-2 border-border shadow-sm overflow-hidden">
                <div className="divide-y divide-border">
                  {discoverData.users.map((user) => (
                    <div key={user.userId} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-all">
                      {/* Profile pic */}
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full border-2 border-primary/30 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-border flex-shrink-0">
                          <Users size={18} className="text-muted-foreground" />
                        </div>
                      )}

                      {/* Name + Esko stage */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.displayName}</p>
                        {user.eskoStage && (
                          <div className="flex items-center gap-1.5">
                            <img
                              src={getEskoImageUrl(user.eskoStage)}
                              alt={user.eskoStage}
                              className="w-4 h-4 object-contain"
                            />
                            <span className="text-[10px] text-muted-foreground">{user.eskoStage}</span>
                          </div>
                        )}
                      </div>

                      {/* Compact stats (visible on sm+) */}
                      <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground flex-shrink-0">
                        <span className="flex items-center gap-0.5" title="Runs">
                          <Footprints size={10} /> {user.totalRuns}
                        </span>
                        <span className="flex items-center gap-0.5" title="Distance">
                          <Ruler size={10} /> {(user.totalDistance / 1000).toFixed(0)}km
                        </span>
                        <span className="flex items-center gap-0.5" title="Medals">
                          <Crown size={10} className="text-yellow-500" /> {user.medalBalance}
                        </span>
                      </div>

                      {/* Add button */}
                      <button
                        onClick={() => handleAddFromDiscover(user.userId)}
                        disabled={isAdding}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-semibold text-xs hover:bg-primary hover:text-white transition-all disabled:opacity-50 flex-shrink-0"
                      >
                        <UserPlus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination footer */}
              {discoverData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                  <p className="text-xs text-muted-foreground">
                    Page {discoverData.pagination.page} of {discoverData.pagination.totalPages} ({discoverData.pagination.total} users)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDiscoverPage(p => Math.max(1, p - 1))}
                      disabled={discoverData.pagination.page <= 1}
                      className="p-2 rounded-lg bg-card border border-border text-sm hover:bg-muted transition-all disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setDiscoverPage(p => Math.min(discoverData.pagination.totalPages, p + 1))}
                      disabled={discoverData.pagination.page >= discoverData.pagination.totalPages}
                      className="p-2 rounded-lg bg-card border border-border text-sm hover:bg-muted transition-all disabled:opacity-50"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
