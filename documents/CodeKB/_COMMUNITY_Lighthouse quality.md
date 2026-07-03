---
type: community
cohesion: 0.40
members: 5
---

# Lighthouse quality

**Cohesion:** 0.40 - moderately connected
**Members:** 5 nodes

## Members
- [[LighthouseAudit]] - code - lib/checks/quality.ts
- [[LighthouseCategory]] - code - lib/checks/quality.ts
- [[extractCategory()]] - code - lib/checks/quality.ts
- [[quality.ts]] - code - lib/checks/quality.ts
- [[qualityCheck]] - code - lib/checks/quality.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Lighthouse_quality
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Core scan checks]]
- 1 edge to [[_COMMUNITY_Advisory UI]]
- 1 edge to [[_COMMUNITY_Content & crawl checks]]
- 1 edge to [[_COMMUNITY_DNS & domain checks]]
- 1 edge to [[_COMMUNITY_Cookies & blocklists]]

## Top bridge nodes
- [[quality.ts]] - degree 9, connects to 5 communities
- [[qualityCheck]] - degree 2, connects to 1 community