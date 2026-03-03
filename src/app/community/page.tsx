import { Globe, Hammer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default function CommunityPage() {
  return (
    <div className="flex flex-col min-h-dvh pb-[calc(env(safe-area-inset-bottom)+4rem)]">
      <PageHeader title="Community" />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Globe className="h-8 w-8 text-muted-foreground" />
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-background border border-border">
            <Hammer className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold">In Arbeit</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Der Community-Tab wird gerade gebaut.<br />Bald kannst du hier Workouts teilen, anderen folgen und dich mit der FitTrack-Community connecten.
          </p>
        </div>
      </div>
    </div>
  );
}
