import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AgendaItem {
  id: string;
  item: string;
  presenter: string;
  time: string;
  sort_order?: number;
}

export function useAgenda() {
  const { user } = useAuth();
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load agenda items for the current user
  useEffect(() => {
    if (!user) {
      setAgenda([]);
      setLoading(false);
      return;
    }

    const loadAgenda = async () => {
      try {
        const { data, error } = await supabase
          .from('agenda_items')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Error loading agenda items:', error);
          return;
        }

        setAgenda(data || []);
      } catch (error) {
        console.error('Error loading agenda items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAgenda();
  }, [user]);

  // Add new agenda item
  const addAgendaItem = async () => {
    if (!user) return;

    const newItem: AgendaItem = {
      id: crypto.randomUUID(),
      item: '',
      presenter: '',
      time: '',
      sort_order: agenda.length
    };

    try {
      const { error } = await supabase
        .from('agenda_items')
        .insert({
          id: newItem.id,
          user_id: user.id,
          item: newItem.item,
          presenter: newItem.presenter,
          time: newItem.time,
          sort_order: newItem.sort_order
        });

      if (error) {
        console.error('Error adding agenda item:', error);
        return;
      }

      setAgenda(prev => [...prev, newItem]);
    } catch (error) {
      console.error('Error adding agenda item:', error);
    }
  };

  // Update agenda item
  const updateAgendaItem = async (id: string, field: keyof AgendaItem, value: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('agenda_items')
        .update({ [field]: value })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating agenda item:', error);
        return;
      }

      setAgenda(prev => prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ));
    } catch (error) {
      console.error('Error updating agenda item:', error);
    }
  };

  // Remove agenda item
  const removeAgendaItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('agenda_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing agenda item:', error);
        return;
      }

      setAgenda(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing agenda item:', error);
    }
  };

  return {
    agenda,
    loading,
    addAgendaItem,
    updateAgendaItem,
    removeAgendaItem
  };
}