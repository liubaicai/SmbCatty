import { Host } from './models';

/**
 * Sanitize host data - removes whitespace from hostname
 */
export const sanitizeHost = (host: Host): Host => {
  const cleanHostname = (host.hostname || '').split(/\s+/)[0];
  return { ...host, hostname: cleanHostname };
};

