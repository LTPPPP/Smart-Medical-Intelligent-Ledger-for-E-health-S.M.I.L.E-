---
name: plantuml-sequence-diagram
description: Generate a PlantUML sequence diagram showing actors, participants, and chronological message flows for a use case or API flow.
risk: low
source: custom
date_added: '2026-06-04'
---

## Use this skill when

- Generating PlantUML sequence diagrams from a use case, API flow, or code path
- Visualizing chronological message flows between actors and components

## Do not use this skill when

- The task is unrelated to sequence diagrams
- You need class or package diagrams (use the corresponding skill)

## Instructions

### Gather context

If the user points to specific code (controller, API endpoint, service method), trace the call chain by reading the relevant files. If the user provides a textual description or use case, use that instead.

### RULE 1 — Numbered steps

Every message MUST be numbered with a continuous sequential number using dot format (`xx.`). No sub-numbering — just 1. 2. 3. 4. etc.:

```
1. action
2. sub-action
3. another action
4. next action
```

### RULE 2 — User activation bar

The actor (User) MUST have an activation bar. `activate user` goes right after the first message from the user. `deactivate user` appears ONLY ONCE at the very last action of the entire diagram. The user stays active through ALL branches (alt/else) — do NOT deactivate user inside branches.

### RULE 3 — Self-call before alt/opt blocks

Before any `alt` or `opt` block, the participant making the decision MUST have a self-call arrow showing what it is checking or validating. Every self-call MUST have a nested `activate`/`deactivate` to render a small activation bar on top of the existing one:

```plantuml
svc -> svc : 6. validate credentials
activate svc
deactivate svc
alt valid
  ...
else invalid
  ...
end
```

### RULE 4 — Correct participant types

| Type | When to use | PlantUML keyword |
|---|---|---|
| `actor` | Human users | `actor` |
| `boundary` | UI components (forms, pages, views) | `boundary` |
| `participant` | Controllers, services, business logic (rectangle box) | `participant` |
| `entity` | Domain entities, models | `entity` |
| `database` | Data stores | `database` |
| `queue` | Message queues | `queue` |

**UI/Frontend** components use `boundary`. **Controllers/Services** use `participant` (renders as a rectangle box). Do NOT use `control` for services.

### RULE 5 — Instance notation with `:`

If a service is a **new instance** created per request/per use case, prefix its name with `:` (UML object notation):

```plantuml
participant ":AuthService" as authSvc
participant ":AccountsService" as accSvc
```

If a service is a **singleton** (one instance handles all requests — e.g., a shared utility or global service), do NOT use `:`:

```plantuml
participant "JwtService" as jwt
database "PostgreSQL" as db
```

### Arrow conventions

| Arrow | Meaning |
|---|---|
| `->` | Synchronous call (solid line) |
| `-->` | Return / response (dashed line) |
| `->>` | Asynchronous message |
| `-->>` | Asynchronous return |

### Control flow blocks

- `alt` / `else` — conditional branches
- `opt` — optional steps
- `loop` — repetition
- `par` — parallel flows
- `group` — logical grouping

### RULE 6 — No note blocks, no separators

Do NOT use `note left of` / `note right of` / `note over`. Do NOT use `== Section ==` separators. Do NOT add parenthetical annotations like `(Zod)`, `(bcryptjs)`, `(async)` in message labels. Keep labels clean — just the action or method name. Keep the diagram as one continuous flow.

### RULE 7 — Activation bars and alt branch order

**Happy path FIRST**: PlantUML shares activation state across alt branches. If you `deactivate` a participant in the first branch, it loses its activation bar in the `else` branch. Always put the happy/longer path as the FIRST `alt` branch and the error/shorter path as the `else` branch.

**Deactivate immediately after return**: `deactivate` a participant right after it sends its return message (`-->`), not batched at the bottom.

Both branches must independently close all activations opened before or inside that branch.

```plantuml
' CORRECT — happy path first, error path in else
alt success
  svc -> db : 5. save(Account)
  activate db
  db --> svc : Account
  deactivate db
  svc --> ctrl : 6. Account
  deactivate svc
  ctrl --> form : 7. 201 Created
  deactivate ctrl
else error
  svc --> ctrl : 8. throw Exception
  activate ctrl
  deactivate svc
  ctrl --> form : 9. 422 error
  deactivate ctrl
end

' WRONG — error path first kills activation bars in else
alt error
  svc --> ctrl : 5. throw Exception
  deactivate svc   ' <-- kills svc bar in else branch!
else success
  svc -> db : 6. save(Account)  ' <-- svc has no activation bar here
end
```

### RULE 8 — No duplicate step numbers across alt branches

Each step number is used exactly ONCE across the entire diagram. The `else` branch continues numbering from where the previous branch left off — do NOT restart or reuse numbers.

### RULE 9 — Return values must not be null

Return messages (`-->`) must always show a meaningful value or type, never `null`. Use the actual return type (e.g., `Account`, `UserProfile`, `Token`) or a result description. If a query may return empty, show `Account / null` to indicate both possibilities.

### Style rules

- Use `activate` / `deactivate` to show lifelines during processing
- Add a title: `title Sequence Diagram — UC: <Use Case Name>`

### Output

Write each `.puml` file to `docs/sequence-diagram/<name>.puml`. Create the folder if it does not exist. Use a descriptive filename based on the UC or flow (e.g., `UC_Signup.puml`).

## Example output

```plantuml
@startuml SequenceDiagram
skinparam shadowing false
skinparam sequenceMessageAlign center

title Sequence Diagram — UC: User Login

actor "User" as user
boundary "LoginForm" as form
participant ":AuthController" as auth
participant ":AuthService" as svc
database "PostgreSQL" as db
participant "JwtService" as jwt

user -> form : 1. Enter email & password
activate user
activate form

form -> form : 2. validate input
activate form
deactivate form

form -> auth : 3. POST /api/v1/auth/email/login
activate auth

auth -> svc : 4. validateLogin(dto)
activate svc

svc -> db : 5. findByEmail(email)
activate db
db --> svc : Account / null
deactivate db

svc -> svc : 6. compare password hash
activate svc
deactivate svc
alt valid credentials
  svc -> jwt : 7. generateJWT(user)
  activate jwt
  jwt --> svc : accessToken + refreshToken
  deactivate jwt

  svc --> auth : 8. LoginResponse
  deactivate svc
  auth --> form : 9. 200 OK + tokens
  deactivate auth
  form --> user : 10. Redirect to dashboard
  deactivate form
else invalid credentials
  svc --> auth : 11. throw UnauthorizedException
  activate auth
  deactivate svc
  auth --> form : 12. 401 Unauthorized
  activate form
  deactivate auth
  form --> user : 13. Show error message
  deactivate form
end

deactivate user

@enduml
```

Note: The happy path ("valid credentials") is the FIRST `alt` branch. The error path is in `else`. This ensures activation bars render correctly in both branches.
