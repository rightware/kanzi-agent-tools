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

{{PLAYBOOK_INDEX}}
