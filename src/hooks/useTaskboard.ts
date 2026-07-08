import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PREVIEW } from "@/preview/previewMode";
import previewBoard from "@/preview/taskboard-data.json";

// Kanban board per steve-handoff.md. Columns and card fields per Steve (2026-07-08).

export const KANBAN_COLUMNS = [
  { key: "backlog", label: "Backlog" },
  { key: "scoping", label: "Scoping" },
  { key: "on_deck", label: "On Deck" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
] as const;

export type ColumnKey = (typeof KANBAN_COLUMNS)[number]["key"];

export const VENTURE_OFFICES = [
  { code: "CHV", name: "Cone Health Ventures" },
  { code: "HLV", name: "Healthliant Ventures" },
  { code: "NGHV", name: "Northeast Georgia Health Ventures" },
  { code: "SVHV", name: "Salinas Valley Health Ventures" },
] as const;

export function officeCode(name: string | null): string {
  const m = VENTURE_OFFICES.find(o => o.name === name);
  return m ? m.code : name || "";
}

export interface KanbanCard {
  id: string;
  title: string;
  notes: string | null;
  assignee: string | null;
  venture_office: string | null;
  intake_date: string | null;
  due: string | null;
  board_column: ColumnKey;
  sort_order: number;
  archived: boolean;
  archived_at: string | null;
}

const uid = () => (crypto as any).randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

function previewCards(): KanbanCard[] {
  return (previewBoard as any).cards.map((c: any) => ({
    archived_at: null, notes: null, assignee: null, due: null, venture_office: null, intake_date: null, ...c,
  }));
}

export function useKanban() {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (PREVIEW) {
      setCards(previewCards());
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("kanban_cards" as any)
        .select("*")
        .order("sort_order");
      if (error) throw error;
      setCards((data as unknown as KanbanCard[]) || []);
    } catch (e) {
      console.error("Error loading board:", e);
      toast.error("Failed to load board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const persist = async (fn: () => PromiseLike<any>) => {
    if (PREVIEW) return;
    try {
      const res: any = await fn();
      if (res && res.error) throw res.error;
    } catch (e) {
      console.error(e);
      toast.error("Save failed");
      fetchAll();
    }
  };

  const updateCard = useCallback((id: string, patch: Partial<KanbanCard>) => {
    setCards(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
    persist(() => supabase.from("kanban_cards" as any).update(patch as any).eq("id", id));
  }, []);

  const addCard = useCallback((column: ColumnKey, sortOrder: number) => {
    const card: KanbanCard = {
      id: uid(), title: "New card", notes: null, assignee: null, venture_office: null,
      intake_date: new Date().toISOString().slice(0, 10), due: null,
      board_column: column, sort_order: sortOrder, archived: false, archived_at: null,
    };
    setCards(prev => [...prev, card]);
    persist(() => supabase.from("kanban_cards" as any).insert(card as any));
    return card.id;
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    persist(() => supabase.from("kanban_cards" as any).delete().eq("id", id));
  }, []);

  const archiveCard = useCallback((id: string) => {
    const at = new Date().toISOString();
    setCards(prev => prev.map(c => (c.id === id ? { ...c, archived: true, archived_at: at } : c)));
    persist(() => supabase.from("kanban_cards" as any).update({ archived: true, archived_at: at } as any).eq("id", id));
  }, []);

  const restoreCard = useCallback((id: string) => {
    setCards(prev => prev.map(c => (c.id === id ? { ...c, archived: false, archived_at: null } : c)));
    persist(() => supabase.from("kanban_cards" as any).update({ archived: false, archived_at: null } as any).eq("id", id));
  }, []);

  return { cards, loading, updateCard, addCard, removeCard, archiveCard, restoreCard, refetch: fetchAll };
}

export function isOverdue(due: string | null): boolean {
  if (!due) return false;
  const [y, m, d] = due.split("-").map(Number);
  if (!y) return false;
  const n = new Date();
  return new Date(y, m - 1, d).getTime() < new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
}

export function formatDue(due: string | null): string {
  if (!due) return "";
  const [y, m, d] = due.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
