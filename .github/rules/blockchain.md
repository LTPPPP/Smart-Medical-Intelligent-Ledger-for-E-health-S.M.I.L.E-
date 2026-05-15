---
applyTo: "blockchain/**"
---

# ⛓️ Blockchain Rules — S.M.I.L.E (Hyperledger Fabric)

## Chaincode Structure

Each chaincode package must follow this layout:

```
<chaincode-name>/
  src/
    index.ts          ← entry point, exports SmartContract class
    <domain>.ts       ← core contract methods
    <domain>.model.ts ← asset / state interfaces
    errors.ts         ← typed error constants
  test/
    <domain>.test.ts
  package.json
  tsconfig.json
```

---

## Chaincode Responsibilities

| File                | Allowed                                    | Forbidden                                   |
| ------------------- | ------------------------------------------ | ------------------------------------------- |
| `index.ts`          | Export contract, wire dependencies         | Business logic                              |
| `<domain>.ts`       | Ledger read/write, ACL checks, emit events | External HTTP calls, non-deterministic code |
| `<domain>.model.ts` | Data type definitions                      | Methods with side effects                   |
| `errors.ts`         | Error code constants                       | App logic                                   |

---

## Determinism Rules (Fabric mandatory)

- **No `Date.now()` or `new Date()`** — use `ctx.stub.getTxTimestamp()`.
- **No `Math.random()`** — Fabric transactions must be deterministic.
- **No external HTTP/network calls** inside chaincode.
- **No non-deterministic map/object iteration** — use sorted arrays.

```typescript
// ✅ CORRECT
const timestamp = ctx.stub.getTxTimestamp();

// ❌ WRONG
const timestamp = new Date().toISOString();
```

---

## Access Control

- Every state-modifying function must verify caller identity via `ctx.clientIdentity`.
- Role checks must use the declared `access-control-cc` chaincode — no inline role logic.
- Patient data access requires a validated consent record from `consent-cc`.

```typescript
// ✅ CORRECT
const role = ctx.clientIdentity.getAttributeValue("role");
if (role !== "DOCTOR") throw new Error("Unauthorized");

// ❌ WRONG — skipping ACL for "convenience"
async updateRecord(ctx, id, data) {
    // no auth check
    await ctx.stub.putState(id, Buffer.from(data));
}
```

---

## State Key Convention

```
<DocType>~<primaryId>              → single asset
<DocType>~<primaryId>~<secondaryId> → composite key (use createCompositeKey)
```

Examples:

- `PATIENT~P001`
- `CONSENT~P001~D007`
- `RECORD~R2024001`

---

## Event Emission

- Every state-mutating transaction must emit a chaincode event.
- Event name format: `<DOMAIN>_<ACTION>` in UPPER_SNAKE_CASE.

```typescript
ctx.stub.setEvent(
  "RECORD_CREATED",
  Buffer.from(JSON.stringify({ id, patientId })),
);
```

---

## Testing

- Every chaincode function must have a unit test using `fabric-shim` mock context.
- Integration tests use `fabric-network` against a local Fabric network.
- Run: `npm test` inside the chaincode directory.

---

## Security

- Never store raw PII on-chain — store encrypted references or hashes only.
- Private data collections must be used for sensitive medical content (see `collections_config.json`).
- All chaincode changes require security review: run the `007` skill audit before merging.
