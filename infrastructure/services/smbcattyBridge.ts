export class BridgeUnavailableError extends Error {
  constructor(message = "SmbCatty bridge unavailable") {
    super(message);
    this.name = "BridgeUnavailableError";
  }
}

export const smbcattyBridge = {
  get(): SmbCattyBridge | undefined {
    return window.smbcatty;
  },

  require(): SmbCattyBridge {
    const bridge = window.smbcatty;
    if (!bridge) throw new BridgeUnavailableError();
    return bridge;
  },
};

