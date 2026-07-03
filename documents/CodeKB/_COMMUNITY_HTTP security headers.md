---
type: community
cohesion: 0.24
members: 11
---

# HTTP security headers

**Cohesion:** 0.24 - loosely connected
**Members:** 11 nodes

## Members
- [[HEADER_REMEDIATION]] - code - lib/remediation.ts
- [[ISSUE_HEADERS]] - code - lib/checks/headers.ts
- [[POLICIES]] - code - lib/checks/http-security.ts
- [[SEC]] - code - lib/checks/headers.ts
- [[headers.ts]] - code - lib/checks/headers.ts
- [[headersCheck]] - code - lib/checks/headers.ts
- [[hsts.ts]] - code - lib/checks/hsts.ts
- [[hstsCheck]] - code - lib/checks/hsts.ts
- [[http-security.ts]] - code - lib/checks/http-security.ts
- [[httpSecurityCheck]] - code - lib/checks/http-security.ts
- [[remediation.ts]] - code - lib/remediation.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/HTTP_security_headers
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_Core scan checks]]
- 4 edges to [[_COMMUNITY_DNS & domain checks]]
- 4 edges to [[_COMMUNITY_Content & crawl checks]]
- 3 edges to [[_COMMUNITY_Advisory UI]]
- 3 edges to [[_COMMUNITY_Cookies & blocklists]]

## Top bridge nodes
- [[headers.ts]] - degree 10, connects to 5 communities
- [[http-security.ts]] - degree 9, connects to 5 communities
- [[hsts.ts]] - degree 8, connects to 5 communities
- [[remediation.ts]] - degree 6, connects to 2 communities
- [[headersCheck]] - degree 2, connects to 1 community