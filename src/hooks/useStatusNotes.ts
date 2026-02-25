import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface StatusNote {
  id: string;
  user_id: string;
  company_name: string;
  deal_id: number | null;
  status_note: string;
  created_at: string;
  updated_at: string;
}

export function useStatusNotes() {
  const { user } = useAuth();
  const [statusNotes, setStatusNotes] = useState<{ [dealId: number]: string }>({});
  const [statusNotesByName, setStatusNotesByName] = useState<{ [companyName: string]: string }>({});
  const [loading, setLoading] = useState(true);

  // Load status notes for the current user
  useEffect(() => {
    if (!user) {
      setStatusNotes({});
      setStatusNotesByName({});
      setLoading(false);
      return;
    }

    const loadStatusNotes = async () => {
      try {
        const { data, error } = await supabase
          .from('status_notes')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading status notes:', error);
          return;
        }

        // Convert array to object for easy lookup by deal_id
        const notesMapById = (data || []).reduce((acc, note) => {
          if (note.deal_id !== null) {
            acc[note.deal_id] = note.status_note || '';
          }
          return acc;
        }, {} as { [dealId: number]: string });

        // Also create lookup by company_name for legacy notes without deal_id
        const notesMapByName = (data || []).reduce((acc, note) => {
          if (note.company_name && note.deal_id === null) {
            acc[note.company_name] = note.status_note || '';
          }
          return acc;
        }, {} as { [companyName: string]: string });

        setStatusNotes(notesMapById);
        setStatusNotesByName(notesMapByName);
      } catch (error) {
        console.error('Error loading status notes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatusNotes();
  }, [user]);

  // Get status note strictly by deal_id (not company name, since names can be shared across offices)
  const getStatusNote = (dealId: number, _companyName?: string): string => {
    return statusNotes[dealId] || '';
  };

  // Save or update status note by deal_id
  const saveStatusNote = async (dealId: number, companyName: string, statusNote: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('status_notes')
        .upsert({
          user_id: user.id,
          deal_id: dealId,
          company_name: companyName,
          status_note: statusNote,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,deal_id'
        });

      if (error) {
        console.error('Error saving status note:', error);
        return false;
      }

      // Update local state
      setStatusNotes(prev => ({
        ...prev,
        [dealId]: statusNote
      }));

      return true;
    } catch (error) {
      console.error('Error saving status note:', error);
      return false;
    }
  };

  // Delete status note by deal_id
  const deleteStatusNote = async (dealId: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('status_notes')
        .delete()
        .eq('user_id', user.id)
        .eq('deal_id', dealId);

      if (error) {
        console.error('Error deleting status note:', error);
        return false;
      }

      // Update local state
      setStatusNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[dealId];
        return newNotes;
      });

      return true;
    } catch (error) {
      console.error('Error deleting status note:', error);
      return false;
    }
  };

  return {
    statusNotes,
    statusNotesByName,
    loading,
    saveStatusNote,
    deleteStatusNote,
    getStatusNote
  };
}
