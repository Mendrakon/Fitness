"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserCheck, UserX, Users, Calendar, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { use } from "react";

interface Profile {
  id: string;
  username: string;
  avatar_url?: string | null;
  created_at: string;
  bio?: string | null;
}

type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "friends";

interface FriendshipRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: profileId } = use(params);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendship, setFriendship] = useState<FriendshipRow | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>("none");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Bio editing state
  const [editingBio, setEditingBio] = useState(false);
  const [draftBio, setDraftBio] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [{ data: { user } }, { data: profileData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("profiles")
          .select("id, username, avatar_url, created_at, bio")
          .eq("id", profileId)
          .single(),
      ]);

      if (!user || !profileData) {
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);
      setProfile(profileData as Profile);

      if (user.id === profileId) {
        setIsOwnProfile(true);
        setLoading(false);
        return;
      }

      const { data: friendshipData } = await supabase
        .from("friendships")
        .select("id, sender_id, receiver_id, status")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${user.id})`
        )
        .maybeSingle();

      if (friendshipData) {
        const row = friendshipData as FriendshipRow;
        setFriendship(row);
        if (row.status === "accepted") {
          setFriendshipStatus("friends");
        } else if (row.status === "pending") {
          setFriendshipStatus(row.sender_id === user.id ? "pending_sent" : "pending_received");
        }
      }

      setLoading(false);
    }
    load();
  }, [profileId]);

  async function saveBio() {
    if (!currentUserId) return;
    setSavingBio(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ bio: draftBio.trim() || null })
      .eq("id", currentUserId);

    if (error) {
      toast.error("Bio konnte nicht gespeichert werden.");
    } else {
      setProfile(prev => prev ? { ...prev, bio: draftBio.trim() || null } : null);
      setEditingBio(false);
      toast.success("Bio gespeichert.");
    }
    setSavingBio(false);
  }

  async function sendRequest() {
    if (!currentUserId) return;
    setActionLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("friendships")
      .insert({ sender_id: currentUserId, receiver_id: profileId, status: "pending" })
      .select("id, sender_id, receiver_id, status")
      .single();

    if (error) {
      toast.error("Anfrage konnte nicht gesendet werden.");
    } else {
      setFriendship(data as FriendshipRow);
      setFriendshipStatus("pending_sent");
      toast.success("Freundschaftsanfrage gesendet!");
    }
    setActionLoading(false);
  }

  async function acceptRequest() {
    if (!friendship) return;
    setActionLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendship.id);

    if (error) {
      toast.error("Fehler beim Annehmen.");
    } else {
      setFriendship(prev => prev ? { ...prev, status: "accepted" } : null);
      setFriendshipStatus("friends");
      toast.success("Freundschaft angenommen!");
    }
    setActionLoading(false);
  }

  async function removeFriend() {
    if (!currentUserId) return;
    setActionLoading(true);
    const supabase = createClient();

    await Promise.all([
      supabase
        .from("friendships")
        .delete()
        .eq("sender_id", currentUserId)
        .eq("receiver_id", profileId),
      supabase
        .from("friendships")
        .delete()
        .eq("sender_id", profileId)
        .eq("receiver_id", currentUserId),
    ]);

    setFriendship(null);
    setFriendshipStatus("none");
    toast.success("Freund entfernt.");
    setActionLoading(false);
  }

  const initials = profile?.username.slice(0, 2).toUpperCase() ?? "??";

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("de-DE", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="flex flex-col">
      <PageHeader title="Profil" showBack />

      <div className="mx-auto w-full max-w-lg px-4 py-6 space-y-4">
        {loading ? (
          <>
            <div className="flex flex-col items-center gap-4 py-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </>
        ) : !profile ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">Nutzer nicht gefunden</p>
          </div>
        ) : (
          <>
            {/* Avatar & Name */}
            <div className="flex flex-col items-center gap-3 py-6">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="h-24 w-24 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold ring-2 ring-border">
                  {initials}
                </div>
              )}

              <div className="text-center">
                <p className="text-xl font-bold">@{profile.username}</p>
                {memberSince && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Mitglied seit {memberSince}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            <Card>
              <CardContent className="py-3">
                {isOwnProfile ? (
                  editingBio ? (
                    <div className="space-y-2">
                      <Textarea
                        value={draftBio}
                        onChange={e => setDraftBio(e.target.value)}
                        placeholder="Schreib etwas über dich…"
                        className="resize-none text-sm min-h-[80px]"
                        maxLength={300}
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{draftBio.length}/300</span>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1.5"
                            onClick={() => setEditingBio(false)}
                          >
                            <X className="h-3.5 w-3.5" />
                            Abbrechen
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 gap-1.5"
                            onClick={saveBio}
                            disabled={savingBio}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Speichern
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="w-full text-left group flex items-start gap-2"
                      onClick={() => { setDraftBio(profile.bio ?? ""); setEditingBio(true); }}
                    >
                      <div className="flex-1 min-w-0">
                        {profile.bio ? (
                          <p className="text-sm whitespace-pre-wrap break-words">{profile.bio}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Noch keine Bio – tippe hier, um eine hinzuzufügen.</p>
                        )}
                      </div>
                      <Pencil className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )
                ) : (
                  profile.bio ? (
                    <p className="text-sm whitespace-pre-wrap break-words">{profile.bio}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Keine Bio vorhanden.</p>
                  )
                )}
              </CardContent>
            </Card>

            {/* Friendship actions */}
            {!isOwnProfile && (
              <div>
                {friendshipStatus === "none" && (
                  <Button className="w-full gap-2" onClick={sendRequest} disabled={actionLoading}>
                    <UserPlus className="h-4 w-4" />
                    Als Freund hinzufügen
                  </Button>
                )}

                {friendshipStatus === "pending_sent" && (
                  <Button className="w-full gap-2" variant="outline" disabled>
                    <UserCheck className="h-4 w-4" />
                    Anfrage gesendet
                  </Button>
                )}

                {friendshipStatus === "pending_received" && (
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2" onClick={acceptRequest} disabled={actionLoading}>
                      <UserCheck className="h-4 w-4" />
                      Annehmen
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      variant="outline"
                      onClick={removeFriend}
                      disabled={actionLoading}
                    >
                      Ablehnen
                    </Button>
                  </div>
                )}

                {friendshipStatus === "friends" && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground">
                      <UserCheck className="h-4 w-4 text-primary" />
                      Befreundet
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 text-muted-foreground hover:text-destructive"
                      onClick={removeFriend}
                      disabled={actionLoading}
                      title="Freund entfernen"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
