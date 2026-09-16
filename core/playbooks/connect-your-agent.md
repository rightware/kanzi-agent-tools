# Connect your agent to Kanzi

Kanzi provides MCP servers that any MCP-capable assistant can use.

{{SERVER_TABLE}}

Servers that accept a version argument hold no session state. Pass the user's Kanzi version whenever the answer could differ between releases.

{{USER_SCOPED_NOTE}}

## Signing in

The Portal sign-in uses the user's own credentials and cannot be completed on their behalf. Register the server, then ask the user to sign in and name the command their assistant uses for it.

## Mainland China

Use `{{PORTAL_CN_ORIGIN}}` as the Portal origin. Where an assistant expands environment variables in its MCP configuration, setting `KANZI_PORTAL_URL` does this without a separate configuration; where it does not, write the origin in directly. The documentation and API servers are the same in both regions.

## Choosing where to look

- How Kanzi works, why it behaves as it does, or how to carry out a task: the documentation server. Pass the user's Kanzi version.
- An exact API fact — a signature or its overloads, which header or import to use, what a type derives from, whether something is deprecated, or what changed between versions: the API reference server. Pass the user's Kanzi version.
- Both servers hold the API reference, so neither is simply "the API one". The documentation server holds it as prose and answers questions about it; the API reference server returns the structured records. Choose on the shape of the answer the user needs, not on whether the subject is an API. With only one of the two registered, use it and say which part of the answer it cannot cover.
- What the user has, may download, or is licensed for: the Portal server.
- Changing a project's dependencies: Kanzi Package Manager and Conan, not these servers.
- Changing a Kanzi project itself: Kanzi Studio, not these servers.

## Server names

Some assistants normalize server names, for example by replacing hyphens with underscores. Match the name used by the local configuration.
