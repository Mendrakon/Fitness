"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, UserCheck, UserX, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  username: string;
  avatar_url?: string | null;
}

interface Friendship {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
  sender: Profile;
  receiver: Profile;
}

function UserAvatar({ username, avatarUrl, size = "md" }: { username: string; avatarUrl?: string | null; size?: "sm" | "md" }) {
  const initials = username.slice(0, 2).toUpperCase();
  const sizeClass = size === "sm" ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold`}>
      {initials}
    </div>
  );
}

export default function FriendsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friendship[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFriendships = useCallback(async (userId: string): Promise<void> => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("friendships")
      .select(
        "id, sender_id, receiver_id, status, " +
        "sender:profiles!friendships_sender_id_fkey(id, username, avatar_url), " +
        "receiver:profiles!friendships_receiver_id_fkey(id, username, avatar_url)"
      )
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) return;

    const accepted: Profile[] = [];
    const incoming: Friendship[] = [];
    const sent = new Set<string>();

    for (const row of (data ?? []) as unknown as Friendship[]) {
      if (row.status === "accepted") {
        const other = row.sender_id === userId ? row.receiver : row.sender;
        accepted.push(other);
      } else if (row.status === "pending") {
        if (row.receiver_id === userId) {
          incoming.push(row);
        } else {
          sent.add(row.receiver_id);
        }
      }
    }

    setFriends(accepted);
    setIncomingRequests(incoming);
    setSentIds(sent);
  }, []);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setCurrentUser(profile as Profile);
        await loadFriendships(user.id);
      }
      setLoading(false);
    }
    init();
  }, [loadFriendships]);

  useEffect(() => {
    if (!currentUser) return;
    const supabase = createClient();

    const channel = supabase
      .channel("friendships-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships", filter: `receiver_id=eq.${currentUser.id}` },
        () => loadFriendships(currentUser.id)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships", filter: `sender_id=eq.${currentUser.id}` },
        () => loadFriendships(currentUser.id)
      )
      .subscribe();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") loadFriendships(currentUser!.id);
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [currentUser, loadFriendships]);

  async function handleSearch() {
    if (!searchQuery.trim() || !currentUser) return;
    setSearching(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .ilike("username", `%${searchQuery.trim()}%`)
      .neq("id", currentUser.id)
      .limit(10);

    if (error) {
      toast.error("Suche fehlgeschlagen.");
    } else {
      setSearchResults((data ?? []) as Profile[]);
      if ((data ?? []).length === 0) toast.info("Kein Nutzer gefunden.");
    }
    setSearching(false);
  }

  async function sendRequest(receiverId: string) {
    if (!currentUser) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("friendships")
      .insert({ sender_id: currentUser.id, receiver_id: receiverId, status: "pending" });

    if (error) {
      toast.error("Anfrage konnte nicht gesendet werden.");
      return;
    }

    setSentIds(prev => new Set(prev).add(receiverId));
    toast.success("Freundschaftsanfrage gesendet!");

    // Push-Notification an Empfänger schicken (funktioniert auch wenn App geschlossen ist)
    fetch("/api/push/friend-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId }),
    }).catch(() => {});
  }

  async function respondToRequest(friendshipId: string, accept: boolean) {
    const supabase = createClient();
    const newStatus = accept ? "accepted" : "declined";

    const { error } = await supabase
      .from("friendships")
      .update({ status: newStatus })
      .eq("id", friendshipId);

    if (error) {
      toast.error("Fehler beim Antworten.");
      return;
    }

    if (currentUser) await loadFriendships(currentUser.id);
    toast.success(accept ? "Freundschaft angenommen!" : "Anfrage abgelehnt.");
  }

  async function removeFriend(friendId: string) {
    if (!currentUser) return;
    const supabase = createClient();

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase
        .from("friendships")
        .delete()
        .eq("sender_id", currentUser.id)
        .eq("receiver_id", friendId),
      supabase
        .from("friendships")
        .delete()
        .eq("sender_id", friendId)
        .eq("receiver_id", currentUser.id),
    ]);

    if (e1 || e2) {
      toast.error("Freund konnte nicht entfernt werden.");
      return;
    }

    await loadFriendships(currentUser.id);
    toast.success("Freund entfernt.");
  }

  const pendingCount = incomingRequests.length;

  return (
    <div className="flex flex-col">
      <PageHeader title="Freunde" />

      <div className="mx-auto w-full max-w-lg px-4 py-4 space-y-4">

        {/* Eigenes Profil */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ) : currentUser ? (
          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => router.push(`/profile/${currentUser.id}`)}
          >
            <CardContent className="flex items-center gap-3 py-3">
              <UserAvatar username={currentUser.username} avatarUrl={currentUser.avatar_url} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">@{currentUser.username}</p>
                <p className="text-xs text-muted-foreground">Dein Profil ansehen</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Suche */}
        <div className="flex gap-2">
          <Input
            placeholder="Benutzername suchen…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching} size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Suchergebnisse */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Suchergebnisse
            </p>
            {searchResults.map((user) => {
              const isFriend = friends.some(f => f.id === user.id);
              const requested = sentIds.has(user.id);
              return (
                <Card key={user.id}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <button
                      className="flex flex-1 items-center gap-3 min-w-0 text-left"
                      onClick={() => router.push(`/profile/${user.id}`)}
                    >
                      <UserAvatar username={user.username} avatarUrl={user.avatar_url} size="sm" />
                      <span className="flex-1 text-sm font-medium truncate">@{user.username}</span>
                    </button>
                    {isFriend ? (
                      <span className="text-xs text-muted-foreground shrink-0">Bereits befreundet</span>
                    ) : requested ? (
                      <span className="text-xs text-muted-foreground shrink-0">Anfrage gesendet</span>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => sendRequest(user.id)}>
                        <UserPlus className="h-3.5 w-3.5" />
                        Hinzufügen
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tabs: Freunde / Anfragen */}
        <Tabs defaultValue="friends">
          <TabsList className="w-full">
            <TabsTrigger value="friends" className="flex-1">
              Freunde
              {friends.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {friends.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1">
              Anfragen
              {pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-3 space-y-2">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="flex items-center gap-3 py-3">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <Skeleton className="h-3.5 flex-1" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : friends.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Noch keine Freunde</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Suche nach Benutzernamen, um Freunde hinzuzufügen.
                  </p>
                </div>
              </div>
            ) : (
              friends.map((friend) => (
                <Card key={friend.id}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <button
                      className="flex flex-1 items-center gap-3 min-w-0 text-left"
                      onClick={() => router.push(`/profile/${friend.id}`)}
                    >
                      <UserAvatar username={friend.username} avatarUrl={friend.avatar_url} size="sm" />
                      <span className="flex-1 text-sm font-medium truncate">@{friend.username}</span>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFriend(friend.id)}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-3 space-y-2">
            {loading ? (
              <>
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="flex items-center gap-3 py-3">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <Skeleton className="h-3.5 flex-1" />
                      <Skeleton className="h-8 w-20 rounded-md" />
                      <Skeleton className="h-8 w-16 rounded-md" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : incomingRequests.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <UserPlus className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Keine offenen Anfragen</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Freundschaftsanfragen erscheinen hier.
                  </p>
                </div>
              </div>
            ) : (
              incomingRequests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <button
                      className="flex flex-1 items-center gap-3 min-w-0 text-left"
                      onClick={() => router.push(`/profile/${req.sender.id}`)}
                    >
                      <UserAvatar username={req.sender.username} avatarUrl={req.sender.avatar_url} size="sm" />
                      <span className="flex-1 text-sm font-medium truncate">@{req.sender.username}</span>
                    </button>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" className="gap-1.5 h-8" onClick={() => respondToRequest(req.id, true)}>
                        <UserCheck className="h-3.5 w-3.5" />
                        Annehmen
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => respondToRequest(req.id, false)}
                        title="Ablehnen"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
