"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { HOHE_WAND_ROUTES } from "@/lib/klettersteig-routes";
import type { KlettersteigRoute } from "@/lib/types";

type DbRoute = {
  id: string;
  location_id: string;
  name: string;
  difficulty: string;
  latitude: number;
  longitude: number;
  elevation_gain: number | null;
  description: string | null;
};

function toRoute(row: DbRoute): KlettersteigRoute {
  return {
    id: row.id,
    locationId: row.location_id,
    name: row.name,
    difficulty: row.difficulty as KlettersteigRoute["difficulty"],
    latitude: row.latitude,
    longitude: row.longitude,
    elevationGain: row.elevation_gain ?? undefined,
    description: row.description ?? undefined,
  };
}

export function useKlettersteigRoutes() {
  const [routes, setRoutes] = useState<KlettersteigRoute[]>(HOHE_WAND_ROUTES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient();
    client
      .from("klettersteig_routes")
      .select("*")
      .then(({ data }) => {
        if (data && data.length > 0) setRoutes(data.map(toRoute));
        setLoading(false);
      });
  }, []);

  const getById = useCallback(
    (routeId: string) => routes.find((r) => r.id === routeId),
    [routes]
  );

  const getByLocation = useCallback(
    (locationId: string) => routes.filter((r) => r.locationId === locationId),
    [routes]
  );

  return { routes, loading, getById, getByLocation };
}
