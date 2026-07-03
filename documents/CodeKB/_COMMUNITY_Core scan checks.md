---
type: community
cohesion: 0.14
members: 20
---

# Core scan checks

**Cohesion:** 0.14 - loosely connected
**Members:** 20 nodes

## Members
- [[TYPES]] - code - lib/checks/dns.ts
- [[a]] - code - lib/registry.ts
- [[all]] - code - lib/registry.ts
- [[b]] - code - lib/registry.ts
- [[carbon.ts]] - code - lib/checks/carbon.ts
- [[carbonCheck]] - code - lib/checks/carbon.ts
- [[checkList]] - code - lib/registry.ts
- [[dns.ts]] - code - lib/checks/dns.ts
- [[dnsCheck]] - code - lib/checks/dns.ts
- [[redirects.ts]] - code - lib/checks/redirects.ts
- [[redirectsCheck]] - code - lib/checks/redirects.ts
- [[registry.ts]] - code - lib/registry.ts
- [[safe-browsing.ts]] - code - lib/checks/safe-browsing.ts
- [[safeBrowsingCheck]] - code - lib/checks/safe-browsing.ts
- [[status.ts]] - code - lib/checks/status.ts
- [[statusCheck]] - code - lib/checks/status.ts
- [[subdomains.ts]] - code - lib/checks/subdomains.ts
- [[subdomainsCheck]] - code - lib/checks/subdomains.ts
- [[tls-audit.ts]] - code - lib/checks/tls-audit.ts
- [[tlsAuditCheck]] - code - lib/checks/tls-audit.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Core_scan_checks
SORT file.name ASC
```

## Connections to other communities
- 25 edges to [[_COMMUNITY_DNS & domain checks]]
- 20 edges to [[_COMMUNITY_Content & crawl checks]]
- 12 edges to [[_COMMUNITY_Cookies & blocklists]]
- 8 edges to [[_COMMUNITY_Advisory UI]]
- 6 edges to [[_COMMUNITY_HTTP security headers]]
- 2 edges to [[_COMMUNITY_API route handler]]
- 2 edges to [[_COMMUNITY_SEO check module]]
- 2 edges to [[_COMMUNITY_Tech stack detection]]
- 2 edges to [[_COMMUNITY_TLS audit]]
- 2 edges to [[_COMMUNITY_Types & contracts]]
- 2 edges to [[_COMMUNITY_Network utilities]]
- 2 edges to [[_COMMUNITY_URL helpers]]
- 2 edges to [[_COMMUNITY_Server info]]
- 2 edges to [[_COMMUNITY_Lighthouse quality]]

## Top bridge nodes
- [[registry.ts]] - degree 78, connects to 14 communities
- [[subdomains.ts]] - degree 7, connects to 4 communities
- [[carbon.ts]] - degree 6, connects to 4 communities
- [[redirects.ts]] - degree 6, connects to 4 communities
- [[safe-browsing.ts]] - degree 6, connects to 4 communities