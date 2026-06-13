import dns from "dns";

const PUBLIC_DNS_SERVERS = ["8.8.8.8", "1.1.1.1"] as const;

export function configureDnsForMongoSrv(): void {
  const servers = dns.getServers();
  const usesOnlyLoopbackDns = servers.every((server) =>
    server.startsWith("127.")
  );

  if (usesOnlyLoopbackDns) {
    dns.setServers([...PUBLIC_DNS_SERVERS]);
  }
}
