import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface StatusNote {
  id: string;
  user_id: string;
  company_name: string;
  status_note: string;
  created_at: string;
  updated_at: string;
}

export function useStatusNotes() {
  const { user } = useAuth();
  const [statusNotes, setStatusNotes] = useState<{ [companyName: string]: string }>({});
  const [loading, setLoading] = useState(true);

  // Load status notes for the current user
  useEffect(() => {
    if (!user) {
      setStatusNotes({});
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

        // Convert array to object for easy lookup
        const notesMap = (data || []).reduce((acc, note) => {
          acc[note.company_name] = note.status_note || '';
          return acc;
        }, {} as { [companyName: string]: string });

        setStatusNotes(notesMap);
      } catch (error) {
        console.error('Error loading status notes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatusNotes();
  }, [user]);

  // Save or update status note
  const saveStatusNote = async (companyName: string, statusNote: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('status_notes')
        .upsert({
          user_id: user.id,
          company_name: companyName,
          status_note: statusNote,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,company_name'
        });

      if (error) {
        console.error('Error saving status note:', error);
        return false;
      }

      // Update local state
      setStatusNotes(prev => ({
        ...prev,
        [companyName]: statusNote
      }));

      return true;
    } catch (error) {
      console.error('Error saving status note:', error);
      return false;
    }
  };

  // Delete status note
  const deleteStatusNote = async (companyName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('status_notes')
        .delete()
        .eq('user_id', user.id)
        .eq('company_name', companyName);

      if (error) {
        console.error('Error deleting status note:', error);
        return false;
      }

      // Update local state
      setStatusNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[companyName];
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
    loading,
    saveStatusNote,
    deleteStatusNote
  };
}