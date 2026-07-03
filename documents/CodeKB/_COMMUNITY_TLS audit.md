---
type: community
cohesion: 0.67
members: 3
---

# TLS audit

**Cohesion:** 0.67 - moderately connected
**Members:** 3 nodes

## Members
- [[WAF_HEADER_SIGS]] - code - lib/checks/firewall.ts
- [[firewall.ts]] - code - lib/checks/firewall.ts
- [[firewallCheck]] - code - lib/checks/firewall.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/TLS_audit
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Core scan checks]]
- 1 edge to [[_COMMUNITY_Advisory UI]]
- 1 edge to [[_COMMUNITY_Content & crawl checks]]
- 1 edge to [[_COMMUNITY_DNS & domain checks]]
- 1 edge to [[_COMMUNITY_Cookies & blocklists]]

## Top bridge nodes
- [[firewall.ts]] - degree 7, connects to 5 communities
- [[firewallCheck]] - degree 2, connects to 1 community