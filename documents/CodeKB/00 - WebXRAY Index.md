---
type: index
---

# WebXRAY CodeKB

Knowledge graph for the WebXRAY codebase, generated with [graphify](https://github.com/safishamsi/graphify).

## How to use in Obsidian

1. Open Obsidian → **Open folder as vault**
2. Select **`~/Documents/documents/CodeKB`** (macOS Documents vault path)
3. Open **Graph view** (left sidebar) to explore connections
4. Open **`graph.canvas`** for a community layout map

## Start here

- [[WebXRAY]] — project goal and product concept
- [[Check]] — core check contract (hub node, 37 edges)
- [[GET()]] — dynamic API route handler
- [[ScanReport()]] — scan orchestration on report pages

## Community hubs

- [[_COMMUNITY_App shell & SEO]]
- [[_COMMUNITY_Advisory UI]]
- [[_COMMUNITY_DNS & domain checks]]
- [[_COMMUNITY_Home page UI]]
- [[_COMMUNITY_Core scan checks]]
- [[_COMMUNITY_HTTP security headers]]
- [[_COMMUNITY_API route handler]]

## Regenerate

From the project root:

```bash
graphify export obsidian --dir documents/CodeKB --graph graphify-out/graph.json --labels graphify-out/.graphify_labels.json
```

Or run `/graphify . --obsidian --obsidian-dir documents/CodeKB` in Cursor.
