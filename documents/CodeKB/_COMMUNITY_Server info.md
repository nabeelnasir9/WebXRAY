---
type: community
cohesion: 0.67
members: 3
---

# Server info

**Cohesion:** 0.67 - moderately connected
**Members:** 3 nodes

## Members
- [[archives.ts]] - code - lib/checks/archives.ts
- [[archivesCheck]] - code - lib/checks/archives.ts
- [[formatTimestamp()]] - code - lib/checks/archives.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Server_info
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Core scan checks]]
- 1 edge to [[_COMMUNITY_Advisory UI]]
- 1 edge to [[_COMMUNITY_Content & crawl checks]]
- 1 edge to [[_COMMUNITY_DNS & domain checks]]
- 1 edge to [[_COMMUNITY_Cookies & blocklists]]

## Top bridge nodes
- [[archives.ts]] - degree 7, connects to 5 communities
- [[archivesCheck]] - degree 2, connects to 1 community