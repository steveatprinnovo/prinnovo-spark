import { useState, useEffect, useCallback } from "react";
import { useUserAuth } from "./useUserAuth";

const STORAGE_KEY = "admin_selected_venture_office";
const CHANGE_EVENT = "admin_venture_office_change";

function readStoredSelection(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const normalized = raw.trim();
  return normalized.toLowerCase() === "all" ? "all" : normalized;
}

export function useAdminVentureOffice() {
  const { isAdmin } = useUserAuth();
  const [selectedVentureOffice, setSelectedVentureOffice] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  const syncFromStorage = useCallback(() => {
    const saved = readStoredSelection();
    if (saved) setSelectedVentureOffice(saved);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const saved = readStoredSelection();
    if (saved) {
      setSelectedVentureOffice(saved);
    } else {
      setShowSelector(true);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) syncFromStorage();
    };

    const onChangeEvent = () => syncFromStorage();

    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onChangeEvent);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onChangeEvent);
    };
  }, [isAdmin, syncFromStorage]);

  const setOffice = (office: string, closeSelector: boolean) => {
    setSelectedVentureOffice(office);
    localStorage.setItem(STORAGE_KEY, office);
    window.dispatchEvent(new Event(CHANGE_EVENT));
    if (closeSelector) setShowSelector(false);
  };

  const selectVentureOffice = (office: string) => {
    setOffice(office, true);
  };

  const changeVentureOffice = (office: string) => {
    setOffice(office, false);
  };

  return {
    selectedVentureOffice: selectedVentureOffice || "all",
    showSelector,
    selectVentureOffice,
    changeVentureOffice,
  };
}
