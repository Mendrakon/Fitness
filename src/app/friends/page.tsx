"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, UserCheck, UserX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

interface Profile {
  id: string;
  username: string;
}

interface Friendship {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
  sender: Profile;
  receiver: Profile;
}

function UserAvatar({ username, size = "md" }: { username: string; size?: "sm" | "md" }) {
  const initials = username.slice(0, 2).toUpperCase();
  const sizeClass = size === "sm" ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm";
  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold`}>
      {initials}
    </div>
  );
}

export default function FriendsPage() {
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
        "sender:profiles!friendships_sender_id_fkey(id, username), " +
        "receiver:profiles!friendships_receiver_id_fkey(id, username)"
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
        .select("id, username")
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
      .select("id, username")
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
    <div className="flex flex-col min-h-dvh pb-[calc(env(safe-area-inset-bottom)+4rem)]">
      <PageHeader title="Freunde" />

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-4 space-y-4">

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
          <Card>
            <CardContent className="flex items-center gap-3 py-3">
              <UserAvatar username={currentUser.username} />
              <div>
                <p className="font-semibold text-sm">@{currentUser.username}</p>
                <p className="text-xs text-muted-foreground">Dein Profil</p>
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
                    <UserAvatar username={user.username} size="sm" />
                    <span className="flex-1 text-sm font-medium">@{user.username}</span>
                    {isFriend ? (
                      <span className="text-xs text-muted-foreground">Bereits befreundet</span>
                    ) : requested ? (
                      <span className="text-xs text-muted-foreground">Anfrage gesendet</span>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => sendRequest(user.id)}>
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
                    <UserAvatar username={friend.username} size="sm" />
                    <span className="flex-1 text-sm font-medium">@{friend.username}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
                    <UserAvatar username={req.sender.username} size="sm" />
                    <span className="flex-1 text-sm font-medium">@{req.sender.username}</span>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="gap-1.5 h-8" onClick={() => respondToRequest(req.id, true)}>
                        <UserCheck className="h-3.5 w-3.5" />
                        Annehmen
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => respondToRequest(req.id, false)}>
                        Ablehnen
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
