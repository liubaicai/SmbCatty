import { useCallback } from "react";
import { smbcattyBridge } from "../../infrastructure/services/smbcattyBridge";

export const useWindowControls = () => {
  const notifyRendererReady = useCallback(() => {
    try {
      smbcattyBridge.get()?.rendererReady?.();
    } catch {
      // ignore
    }
  }, []);

  const closeSettingsWindow = useCallback(async () => {
    const bridge = smbcattyBridge.get();
    await bridge?.closeSettingsWindow?.();
  }, []);

  const openSettingsWindow = useCallback(async () => {
    const bridge = smbcattyBridge.get();
    return bridge?.openSettingsWindow?.();
  }, []);

  const minimize = useCallback(async () => {
    const bridge = smbcattyBridge.get();
    await bridge?.windowMinimize?.();
  }, []);

  const maximize = useCallback(async () => {
    const bridge = smbcattyBridge.get();
    return bridge?.windowMaximize?.();
  }, []);

  const close = useCallback(async () => {
    const bridge = smbcattyBridge.get();
    await bridge?.windowClose?.();
  }, []);

  const isMaximized = useCallback(async () => {
    const bridge = smbcattyBridge.get();
    return bridge?.windowIsMaximized?.();
  }, []);

  const isFullscreen = useCallback(async () => {
    const bridge = smbcattyBridge.get();
    return bridge?.windowIsFullscreen?.() ?? false;
  }, []);

  const onFullscreenChanged = useCallback((cb: (isFullscreen: boolean) => void) => {
    const bridge = smbcattyBridge.get();
    return bridge?.onWindowFullScreenChanged?.(cb) ?? (() => {});
  }, []);

  return {
    notifyRendererReady,
    closeSettingsWindow,
    openSettingsWindow,
    minimize,
    maximize,
    close,
    isMaximized,
    isFullscreen,
    onFullscreenChanged,
  };
};
