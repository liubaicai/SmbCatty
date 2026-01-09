import { useCallback } from "react";
import { smbcattyBridge } from "../../infrastructure/services/smbcattyBridge";

export const useKnownHostsBackend = () => {
  const readKnownHosts = useCallback(async () => {
    const bridge = smbcattyBridge.get();
    return bridge?.readKnownHosts?.();
  }, []);

  return { readKnownHosts };
};

