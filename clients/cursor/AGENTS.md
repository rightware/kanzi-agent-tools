<!-- Generated from core/ by tools/build.mjs. Do not edit. -->

# Working with Kanzi

Kanzi is a toolchain for building 3D and 2D user interfaces for automotive and embedded devices.

## Which tool handles which request

Kanzi tooling separates into four layers. Requests are frequently sent to the wrong one.

| Layer | The question | Where it is answered | Covered here |
|---|---|---|---|
| Install | What am I entitled to, and how do I get it? | Kanzi Portal MCP server | Yes |
| Identify | Which platform package fits this board? | Kanzi platform scanner | No |
| Depend | What does this project require? | Kanzi Package Manager, Conan | No |
| Author | Change the project itself | Kanzi Studio | No |

Only the Install layer is configured by this repository. When a request belongs to another layer, name the tool that handles it instead of approximating an answer with the servers that are available.

## Ground rules

- Kanzi releases differ. Establish which version the project targets before answering from documentation, and pass that version to the servers that accept one.
- Platform packages are identified by a combination of operating system, windowing system, architecture, toolchain, graphics API, font backend, and linkage. Resolve the package name rather than guessing it.
- Do not infer procedures that are not written down here. If no playbook covers the task, say so.

## Playbooks

| Playbook | Use it when |
|---|---|
| Connect your agent to Kanzi | Register and use the Kanzi MCP servers. Use when setting up Kanzi access for an assistant, when a Kanzi server needs signing in to, when deciding whether a question belongs to the documentation, the API reference or the user's Portal account, or when working in mainland China. |

---

# Connect your agent to Kanzi

Kanzi provides MCP servers that any MCP-capable assistant can use.

| Server | Registered as | What it gives you | Version argument | Sign-in |
|---|---|---|---|---|
| Kanzi Documentation MCP server | `kanzi-docs` | The Kanzi documentation for any version: guides, tutorials, best practices, and how things work | Yes | Not needed |
| Kanzi API MCP server | `kanzi-api` | The Kanzi API reference for any version: exact signatures, includes, type hierarchies, and version diffs | Yes | Not needed |
| Kanzi Portal MCP server | `kanzi-portal` | Your own Portal account: licenses, downloads, platform packages, support tickets | No | Once, in a browser |

Servers that accept a version argument hold no session state. Pass the user's Kanzi version whenever the answer could differ between releases.

Kanzi Portal MCP server acts as the signed-in user and stays within that user's permissions. An operation the user is not permitted to perform returns a permission error. Report that error rather than retrying or working around it.

## Signing in

The Portal sign-in uses the user's own credentials and cannot be completed on their behalf. Register the server, then ask the user to sign in and name the command their assistant uses for it.

## Mainland China

Use `https://portal.kanzi.cn` as the Portal origin. Where an assistant expands environment variables in its MCP configuration, setting `KANZI_PORTAL_URL` does this without a separate configuration; where it does not, write the origin in directly. The documentation and API servers are the same in both regions.

## Choosing where to look

- How Kanzi works, why it behaves as it does, or how to carry out a task: the documentation server. Pass the user's Kanzi version.
- An exact API fact — a signature or its overloads, which header or import to use, what a type derives from, whether something is deprecated, or what changed between versions: the API reference server. Pass the user's Kanzi version.
- Both servers hold the API reference, so neither is simply "the API one". The documentation server holds it as prose and answers questions about it; the API reference server returns the structured records. Choose on the shape of the answer the user needs, not on whether the subject is an API. With only one of the two registered, use it and say which part of the answer it cannot cover.
- What the user has, may download, or is licensed for: the Portal server.
- Changing a project's dependencies: Kanzi Package Manager and Conan, not these servers.
- Changing a Kanzi project itself: Kanzi Studio, not these servers.

## Server names

Some assistants normalize server names, for example by replacing hyphens with underscores. Match the name used by the local configuration.
