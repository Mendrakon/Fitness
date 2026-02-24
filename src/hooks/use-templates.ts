"use client";

import { useCallback } from "react";
import { v4 as uuid } from "uuid";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { Template, Workout, TemplateExercise, TemplateSet } from "@/lib/types";

export function useTemplates() {
  const [templates, setTemplates] = useLocalStorage<Template[]>(STORAGE_KEYS.TEMPLATES, []);

  const getById = useCallback(
    (id: string) => templates.find(t => t.id === id),
    [templates]
  );

  const getByFolder = useCallback(
    (folderId: string | null) => templates.filter(t => t.folderId === folderId),
    [templates]
  );

  const create = useCallback(
    (template: Omit<Template, "id" | "createdAt" | "updatedAt" | "lastUsed">) => {
      const now = new Date().toISOString();
      const newTemplate: Template = {
        ...template,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
        lastUsed: null,
      };
      setTemplates(prev => [newTemplate, ...prev]);
      return newTemplate;
    },
    [setTemplates]
  );

  const update = useCallback(
    (id: string, updates: Partial<Template>) => {
      setTemplates(prev =>
        prev.map(t =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        )
      );
    },
    [setTemplates]
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      setTemplates(prev => prev.filter(t => t.id !== id));
    },
    [setTemplates]
  );

  const markUsed = useCallback(
    (id: string) => {
      setTemplates(prev =>
        prev.map(t =>
          t.id === id ? { ...t, lastUsed: new Date().toISOString() } : t
        )
      );
    },
    [setTemplates]
  );

  const saveWorkoutAsTemplate = useCallback(
    (workout: Workout, name: string, folderId: string | null = null) => {
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
    (id: string) => {
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
