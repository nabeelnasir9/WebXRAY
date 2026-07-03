---
type: community
cohesion: 0.50
members: 4
---

# SEO check module

**Cohesion:** 0.50 - moderately connected
**Members:** 4 nodes

## Members
- [[REMEDIATION]] - code - lib/checks/seo.ts
- [[meta()]] - code - lib/checks/seo.ts
- [[seo.ts]] - code - lib/checks/seo.ts
- [[seoCheck]] - code - lib/checks/seo.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/SEO_check_module
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Content & crawl checks]]
- 2 edges to [[_COMMUNITY_Core scan checks]]
- 1 edge to [[_COMMUNITY_Advisory UI]]
- 1 edge to [[_COMMUNITY_DNS & domain checks]]
- 1 edge to [[_COMMUNITY_Cookies & blocklists]]

## Top bridge nodes
- [[seo.ts]] - degree 9, connects to 5 communities
- [[seoCheck]] - degree 2, connects to 1 community