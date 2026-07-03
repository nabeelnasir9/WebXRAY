---
type: community
cohesion: 0.09
members: 36
---

# DNS & domain checks

**Cohesion:** 0.09 - loosely connected
**Members:** 36 nodes

## Members
- [[DKIM_SELECTORS]] - code - lib/checks/mail-config.ts
- [[DohAnswer]] - code - lib/net.ts
- [[DohResponse]] - code - lib/net.ts
- [[KNOWN_RDAP_BASES]] - code - lib/net.ts
- [[KNOWN_WHOIS_SERVERS]] - code - lib/net.ts
- [[RDAP_SKIP_TLDS]] - code - lib/net.ts
- [[RdapJson]] - code - lib/net.ts
- [[RegistrationRecord]] - code - lib/net.ts
- [[dns-server.ts]] - code - lib/checks/dns-server.ts
- [[dnsServerCheck]] - code - lib/checks/dns-server.ts
- [[dnssec.ts]] - code - lib/checks/dnssec.ts
- [[dnssecCheck]] - code - lib/checks/dnssec.ts
- [[doh()]] - code - lib/net.ts
- [[dohData()]] - code - lib/net.ts
- [[domain.ts]] - code - lib/checks/domain.ts
- [[domainCheck]] - code - lib/checks/domain.ts
- [[fetchRegistration()]] - code - lib/net.ts
- [[host-names.ts]] - code - lib/checks/host-names.ts
- [[hostNamesCheck]] - code - lib/checks/host-names.ts
- [[mail-config.ts]] - code - lib/checks/mail-config.ts
- [[mailConfigCheck]] - code - lib/checks/mail-config.ts
- [[net.ts]] - code - lib/net.ts
- [[parseRdapJson()]] - code - lib/net.ts
- [[parseWhoisText()]] - code - lib/net.ts
- [[ptr()]] - code - lib/checks/host-names.ts
- [[rank.ts]] - code - lib/checks/rank.ts
- [[rankCheck]] - code - lib/checks/rank.ts
- [[rdapRegistrarName()]] - code - lib/net.ts
- [[registrableDomain()]] - code - lib/net.ts
- [[txt-records.ts]] - code - lib/checks/txt-records.ts
- [[txtRecordsCheck]] - code - lib/checks/txt-records.ts
- [[unquoteTxt()]] - code - lib/net.ts
- [[whois.ts]] - code - lib/checks/whois.ts
- [[whoisCheck]] - code - lib/checks/whois.ts
- [[whoisField()]] - code - lib/net.ts
- [[whoisQuery()]] - code - lib/net.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/DNS__domain_checks
SORT file.name ASC
```

## Connections to other communities
- 25 edges to [[_COMMUNITY_Core scan checks]]
- 14 edges to [[_COMMUNITY_Content & crawl checks]]
- 9 edges to [[_COMMUNITY_Cookies & blocklists]]
- 8 edges to [[_COMMUNITY_Advisory UI]]
- 4 edges to [[_COMMUNITY_HTTP security headers]]
- 2 edges to [[_COMMUNITY_URL helpers]]
- 1 edge to [[_COMMUNITY_Tech stack detection]]
- 1 edge to [[_COMMUNITY_Lighthouse quality]]
- 1 edge to [[_COMMUNITY_Server info]]
- 1 edge to [[_COMMUNITY_SEO check module]]
- 1 edge to [[_COMMUNITY_TLS audit]]

## Top bridge nodes
- [[net.ts]] - degree 53, connects to 10 communities
- [[mail-config.ts]] - degree 10, connects to 4 communities
- [[rank.ts]] - degree 7, connects to 4 communities
- [[dns-server.ts]] - degree 7, connects to 3 communities
- [[dnssec.ts]] - degree 7, connects to 3 communities