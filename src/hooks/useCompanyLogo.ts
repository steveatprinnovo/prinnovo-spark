import { useState, useEffect } from "react";

export function useCompanyLogo(imgUrl: string | null) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    setLogoUrl(imgUrl);
  }, [imgUrl]);

  return { logoUrl, loading };
}