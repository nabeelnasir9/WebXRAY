import net from 'node:net';
import type { Check } from '../types';

const COMMON: { port: number; service: string }[] = [
  { port: 21, service: 'FTP' },
  { port: 22, service: 'SSH' },
  { port: 25, service: 'SMTP' },
  { port: 80, service: 'HTTP' },
  { port: 110, service: 'POP3' },
  { port: 143, service: 'IMAP' },
  { port: 443, service: 'HTTPS' },
  { port: 3306, service: 'MySQL' },
  { port: 3389, service: 'RDP' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 6379, service: 'Redis' },
  { port: 8080, service: 'HTTP-alt' },
];

function probe(host: string, port: number, ms = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (open: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(ms);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

export const portsCheck: Check = {
  id: 'ports',
  title: 'Open ports',
  async run(url) {
    const host = url.hostname;
    const results = await Promise.all(
      COMMON.map(async (c) => ({ ...c, open: await probe(host, c.port) })),
    );
    return {
      open: results.filter((r) => r.open).map((r) => `${r.port} (${r.service})`),
      closed: results.filter((r) => !r.open).length,
    };
  },
  advise(data) {
    const open = (data.open as string[]) ?? [];
    const risky = open.filter((o) => /(\b21\b|\b3306\b|\b3389\b|\b5432\b|\b6379\b)/.test(o));
    if (risky.length === 0) return [{ level: 'pass', title: 'No sensitive ports publicly reachable' }];
    return [
      {
        level: 'warning',
        title: `Sensitive port(s) reachable: ${risky.join(', ')}`,
        detail: 'Databases and remote-access services should not be exposed to the public internet.',
        remediation: 'Restrict these ports with a firewall / security group to trusted IPs, or bind them to localhost / a private network.',
      },
    ];
  },
};
