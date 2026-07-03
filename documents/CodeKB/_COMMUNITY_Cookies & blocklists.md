---
type: community
cohesion: 0.20
members: 12
---

# Cookies & blocklists

**Cohesion:** 0.20 - loosely connected
**Members:** 12 nodes

## Members
- [[ParsedCookie]] - code - lib/checks/cookies.ts
- [[RESOLVERS]] - code - lib/checks/block-lists.ts
- [[block-lists.ts]] - code - lib/checks/block-lists.ts
- [[blockListsCheck]] - code - lib/checks/block-lists.ts
- [[cookies.ts]] - code - lib/checks/cookies.ts
- [[cookiesCheck]] - code - lib/checks/cookies.ts
- [[loadBootstrap()]] - code - lib/net.ts
- [[rdapDomain()]] - code - lib/net.ts
- [[resolves()]] - code - lib/checks/block-lists.ts
- [[screenshot.ts]] - code - lib/checks/screenshot.ts
- [[screenshotCheck]] - code - lib/checks/screenshot.ts
- [[timedFetch()]] - code - lib/net.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Cookies__blocklists
SORT file.name ASC
```

## Connections to other communities
- 12 edges to [[_COMMUNITY_Core scan checks]]
- 9 edges to [[_COMMUNITY_DNS & domain checks]]
- 4 edges to [[_COMMUNITY_Content & crawl checks]]
- 3 edges to [[_COMMUNITY_Advisory UI]]
- 3 edges to [[_COMMUNITY_HTTP security headers]]
- 1 edge to [[_COMMUNITY_Lighthouse quality]]
- 1 edge to [[_COMMUNITY_Server info]]
- 1 edge to [[_COMMUNITY_SEO check module]]
- 1 edge to [[_COMMUNITY_TLS audit]]
- 1 edge to [[_COMMUNITY_URL helpers]]

## Top bridge nodes
- [[timedFetch()]] - degree 24, connects to 9 communities
- [[block-lists.ts]] - degree 8, connects to 4 communities
- [[cookies.ts]] - degree 7, connects to 4 communities
- [[screenshot.ts]] - degree 6, connects to 4 communities
- [[rdapDomain()]] - degree 4, connects to 1 community