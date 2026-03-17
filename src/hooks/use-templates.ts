"use client";

import { useCallback, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { createClient } from "@/lib/supabase";
import type { Template, Workout, TemplateExercise, TemplateSet } from "@/lib/types";

type TemplateRow = {
  id: string;
  user_id: string;
  name: string;
  folder_id: string | null;
  exercises: TemplateExercise[];
  notes: string;
  last_used: string | null;
  source_event_id: string | null;
  created_at: string;
  updated_at: string;
};

function toRow(t: Template, userId: string): TemplateRow {
  return {
    id: t.id,
    user_id: userId,
    name: t.name,
    folder_id: t.folderId,
    exercises: t.exercises,
    notes: t.notes,
    last_used: t.lastUsed,
    source_event_id: t.sourceEventId ?? null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

function fromRow(row: TemplateRow): Template {
  return {
    id: row.id,
    name: row.name,
    folderId: row.folder_id,
    exercises: row.exercises,
    notes: row.notes,
    lastUsed: row.last_used,
    sourceEventId: row.source_event_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useTemplates() {
  const [templates, setTemplates] = useLocalStorage<Template[]>(STORAGE_KEYS.TEMPLATES, []);
  const templatesRef = useRef(templates);
  templatesRef.current = templates;

  // On mount: load from Supabase and migrate any local-only items
  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const { data: rows } = await client
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (!rows) return;

      const fromDb = rows.map(fromRow);
      const dbIds = new Set(fromDb.map((t) => t.id));

      // Upload any templates that only exist in localStorage
      const localOnly = templatesRef.current.filter((t) => !dbIds.has(t.id));
      if (localOnly.length > 0) {
        await client
          .from("templates")
          .upsert(localOnly.map((t) => toRow(t, user.id)));
      }

      setTemplates([...fromDb, ...localOnly]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getById = useCallback(
    (id: string) => templates.find(t => t.id === id),
    [templates]
  );

  const getByFolder = useCallback(
    (folderId: string | null) => templates.filter(t => t.folderId === folderId),
    [templates]
  );

  const create = useCallback(
    async (template: Omit<Template, "id" | "createdAt" | "updatedAt" | "lastUsed">) => {
      const now = new Date().toISOString();
      const newTemplate: Template = {
        ...template,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
        lastUsed: null,
      };

      setTemplates(prev => [newTemplate, ...prev]);

      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        await client.from("templates").insert(toRow(newTemplate, user.id));
      }

      return newTemplate;
    },
    [setTemplates]
  );

  const update = useCallback(
    async (id: string, updates: Partial<Template>) => {
      const now = new Date().toISOString();
      setTemplates(prev =>
        prev.map(t =>
          t.id === id ? { ...t, ...updates, updatedAt: now } : t
        )
      );

      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return;

      const dbUpdates: Partial<TemplateRow> = { updated_at: now };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId;
      if (updates.exercises !== undefined) dbUpdates.exercises = updates.exercises;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.lastUsed !== undefined) dbUpdates.last_used = updates.lastUsed;

      await client.from("templates").update(dbUpdates).eq("id", id).eq("user_id", user.id);
    },
    [setTemplates]
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      setTemplates(prev => prev.filter(t => t.id !== id));

      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        await client.from("templates").delete().eq("id", id).eq("user_id", user.id);
      }
    },
    [setTemplates]
  );

  const markUsed = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();
      setTemplates(prev =>
        prev.map(t => t.id === id ? { ...t, lastUsed: now } : t)
      );

      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        await client.from("templates").update({ last_used: now }).eq("id", id).eq("user_id", user.id);
      }
    },
    [setTemplates]
  );

  const saveWorkoutAsTemplate = useCallback(
    async (workout: Workout, name: string, folderId: string | null = null) => {
      const exercises: TemplateExercise[] = workout.exercises.map(we => ({
        id: uuid(),
        exerciseId: we.exerciseId,
        sets: we.sets.map(s => ({
          id: uuid(),
          weight: s.weight,
          reps: s.reps,
          tag: s.tag,
          rpe: s.rpe,
        } as TemplateSet)),
        notes: we.notes,
        supersetGroupId: we.supersetGroupId,
      }));
      return create({ name, folderId, exercises, notes: workout.notes });
    },
    [create]
  );

  const duplicate = useCallback(
    async (id: string) => {
      const original = templates.find(t => t.id === id);
      if (!original) return null;
      return create({
        name: `${original.name} (Kopie)`,
        folderId: original.folderId,
        exercises: original.exercises.map(e => ({
          ...e,
          id: uuid(),
          sets: e.sets.map(s => ({ ...s, id: uuid() })),
        })),
        notes: original.notes,
      });
    },
    [templates, create]
  );

  return {
    templates,
    getById,
    getByFolder,
    create,
    update,
    deleteTemplate,
    markUsed,
    saveWorkoutAsTemplate,
    duplicate,
  };
}
