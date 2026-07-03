---
type: community
cohesion: 0.50
members: 4
---

# Tech stack detection

**Cohesion:** 0.50 - moderately connected
**Members:** 4 nodes

## Members
- [[SIGNATURES]] - code - lib/checks/tech-stack.ts
- [[Sig]] - code - lib/checks/tech-stack.ts
- [[tech-stack.ts]] - code - lib/checks/tech-stack.ts
- [[techStackCheck]] - code - lib/checks/tech-stack.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tech_stack_detection
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Content & crawl checks]]
- 2 edges to [[_COMMUNITY_Core scan checks]]
- 1 edge to [[_COMMUNITY_Advisory UI]]
- 1 edge to [[_COMMUNITY_DNS & domain checks]]

## Top bridge nodes
- [[tech-stack.ts]] - degree 8, connects to 4 communities
- [[techStackCheck]] - degree 2, connects to 1 community