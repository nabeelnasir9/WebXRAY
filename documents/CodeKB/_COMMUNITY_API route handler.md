---
type: community
cohesion: 0.33
members: 7
---

# API route handler

**Cohesion:** 0.33 - loosely connected
**Members:** 7 nodes

## Members
- [[Check registry pattern]] - rationale - CLAUDE.md
- [[Dynamic check route handler]] - rationale - CLAUDE.md
- [[GET()]] - code - app/api/check/[id]/route.ts
- [[Vercel 10 second function cap]] - rationale - CLAUDE.md
- [[registry]] - code - lib/registry.ts
- [[route.ts]] - code - app/api/check/[id]/route.ts
- [[withTimeout()]] - code - app/api/check/[id]/route.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/API_route_handler
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Core scan checks]]
- 2 edges to [[_COMMUNITY_Advisory UI]]

## Top bridge nodes
- [[route.ts]] - degree 6, connects to 2 communities
- [[registry]] - degree 3, connects to 1 community