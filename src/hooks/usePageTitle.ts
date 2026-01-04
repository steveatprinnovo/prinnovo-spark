import { useEffect } from "react";

export function usePageTitle(pageTitle: string) {
  useEffect(() => {
    document.title = `Prinnovo Internal - ${pageTitle}`;
    return () => {
      document.title = "Prinnovo Internal";
    };
  }, [pageTitle]);
}
