import { useState, useEffect } from "react";
import { useUserAuth } from "./useUserAuth";

const STORAGE_KEY = "admin_selected_venture_office";

export function useAdminVentureOffice() {
  const { isAdmin } = useUserAuth();
  const [selectedVentureOffice, setSelectedVentureOffice] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      // Check if there's a saved selection
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSelectedVentureOffice(saved);
      } else {
        // Show selector for first time
        setShowSelector(true);
      }
    }
  }, [isAdmin]);

  const selectVentureOffice = (office: string) => {
    setSelectedVentureOffice(office);
    localStorage.setItem(STORAGE_KEY, office);
    setShowSelector(false);
  };

  const changeVentureOffice = (office: string) => {
    setSelectedVentureOffice(office);
    localStorage.setItem(STORAGE_KEY, office);
  };

  return {
    selectedVentureOffice: selectedVentureOffice || "all",
    showSelector,
    selectVentureOffice,
    changeVentureOffice,
  };
}
