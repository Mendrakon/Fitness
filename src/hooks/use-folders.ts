"use client";

import { useCallback, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { createClient } from "@/lib/supabase";
import type { Folder } from "@/lib/types";

type FolderRow = {
  id: string;
  user_id: string;
  name: string;
  order: number;
};

function toRow(f: Folder, userId: string): FolderRow {
  return { id: f.id, user_id: userId, name: f.name, order: f.order };
}

function fromRow(row: FolderRow): Folder {
  return { id: row.id, name: row.name, order: row.order };
}

export function useFolders() {
  const [folders, setFolders] = useLocalStorage<Folder[]>(STORAGE_KEYS.FOLDERS, []);
  const foldersRef = useRef(folders);
  foldersRef.current = folders;

  // On mount: load from Supabase and migrate any local-only items
  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const { data: rows } = await client
        .from("folders")
        .select("*")
        .order("order", { ascending: true });

      if (!rows) return;

      const fromDb = rows.map(fromRow);
      const dbIds = new Set(fromDb.map((f) => f.id));

      // Upload any folders that only exist in localStorage
      const localOnly = foldersRef.current.filter((f) => !dbIds.has(f.id));
      if (localOnly.length > 0) {
        await client.from("folders").upsert(localOnly.map((f) => toRow(f, user.id)));
      }

      setFolders([...fromDb, ...localOnly]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useCallback(
    async (name: string) => {
      const maxOrder = foldersRef.current.reduce((max, f) => Math.max(max, f.order), -1);
      const newFolder: Folder = { id: uuid(), name, order: maxOrder + 1 };
      setFolders(prev => [...prev, newFolder]);

      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        await client.from("folders").insert(toRow(newFolder, user.id));
      }

      return newFolder;
    },
    [setFolders]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      setFolders(prev => prev.map(f => (f.id === id ? { ...f, name } : f)));

      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        await client.from("folders").update({ name }).eq("id", id).eq("user_id", user.id);
      }
    },
    [setFolders]
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      setFolders(prev => prev.filter(f => f.id !== id));

      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        await client.from("folders").delete().eq("id", id).eq("user_id", user.id);
      }
    },
    [setFolders]
  );

  return {
    folders: folders.sort((a, b) => a.order - b.order),
    create,
    rename,
    deleteFolder,
  };
}
