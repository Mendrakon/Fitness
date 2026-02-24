"use client";

import { useCallback } from "react";
import { v4 as uuid } from "uuid";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { Folder } from "@/lib/types";

export function useFolders() {
  const [folders, setFolders] = useLocalStorage<Folder[]>(STORAGE_KEYS.FOLDERS, []);

  const create = useCallback(
    (name: string) => {
      const maxOrder = folders.reduce((max, f) => Math.max(max, f.order), -1);
      const newFolder: Folder = { id: uuid(), name, order: maxOrder + 1 };
      setFolders(prev => [...prev, newFolder]);
      return newFolder;
    },
    [folders, setFolders]
  );

  const rename = useCallback(
    (id: string, name: string) => {
      setFolders(prev => prev.map(f => (f.id === id ? { ...f, name } : f)));
    },
    [setFolders]
  );

  const deleteFolder = useCallback(
    (id: string) => {
      setFolders(prev => prev.filter(f => f.id !== id));
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
