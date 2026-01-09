import { useCallback } from "react";
import { smbcattyBridge } from "../../infrastructure/services/smbcattyBridge";

export type ApplicationInfo = {
  name: string;
  version: string;
  platform: string;
};

export const useApplicationBackend = () => {
  const openExternal = useCallback(async (url: string) => {
    try {
      const bridge = smbcattyBridge.get();
      if (bridge?.openExternal) {
        await bridge.openExternal(url);
        return;
      }
    } catch {
      // Ignore and fall back below
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const getApplicationInfo = useCallback(async (): Promise<ApplicationInfo | null> => {
    const bridge = smbcattyBridge.get();
    const info = await bridge?.getAppInfo?.();
    return info ?? null;
  }, []);

  return { openExternal, getApplicationInfo };
};

