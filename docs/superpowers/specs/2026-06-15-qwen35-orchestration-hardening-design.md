# Qwen3.5 Migration And Tool Orchestration Hardening

Date: 2026-06-15
Branch: `feat/ai/react-agentic-chatbot`

## Goal

Replace the booking agent planner model with `Qwen/Qwen3.5-4B` and improve the
grounded read-tool loop so that:

- Qwen3.5-4B is the only production planner model. There is no runtime fallback
  to Qwen2.5-7B.
- Reasoning is enabled adaptively for complex planning turns and disabled for
  ordinary turns.
- Clinic, service, clinic-service, and specialty reads become durable,
  referenceable candidate lists.
- The agent cannot repeatedly execute the same read tool with the same
  arguments until the step budget is exhausted.

## Runtime Model

The default planner model becomes `Qwen/Qwen3.5-4B`.

The vLLM server must use:

- `--language-model-only` because the booking agent is text-only.
- `--reasoning-parser qwen3`.
- `--enable-auto-tool-choice`.
- `--tool-call-parser qwen3_coder`.
- A conservative `--max-model-len 8192` for the current RTX 3060 12 GB runtime.

Qwen2.5-7B remains historical benchmark information only. The application does
not retry, route, or fall back to it when Qwen3.5 fails. Model startup failure
and planner HTTP failure must be visible errors so debugging remains
deterministic.

## Adaptive Reasoning

Reasoning mode is selected before each planner request by deterministic
application logic. It is not selected by another LLM.

Thinking is disabled for the first simple planning call in a turn. It is enabled
when at least one of these conditions is true:

- The current user message contains signals for multiple goals or a goal switch.
- Reference resolution is ambiguous or requires reconciling multiple candidate
  lists.
- The current turn already executed a distinct read tool and needs another
  planning step.
- The previous planner action in the current turn was blocked as a duplicate
  read and the planner must choose a different action.

The planner sends the selected mode through:

```json
{
  "chat_template_kwargs": {
    "enable_thinking": true
  }
}
```

The default is `false`. Reasoning content is not copied into session memory,
observability payloads, or user-visible replies. Metadata records only the
selected reasoning mode and its deterministic reason.

## Prompt Budget

The 8,192-token model context is a hard runtime limit, not an invitation to fill
the prompt. The backend state keeps complete bounded candidate lists, while the
planner receives a smaller deterministic view.

The first implementation must:

- Limit each candidate kind rendered into the planner prompt to 20 items.
- Limit the combined rendered candidate view to 40 items.
- Limit candidate labels to 160 characters after redaction.
- Keep at most eight recent redacted turns and 500 characters per turn.
- Limit each compact observation summary to 500 characters.
- Send compact observation summaries instead of raw tool payloads.
- Keep read signatures and duplicate hints compact and bounded by the current
  turn's step budget.
- Set a configurable planner input budget of 6,144 tokens, reserving at least
  2,048 tokens for model output and reasoning.

Prompt assembly removes the least relevant candidate kinds first while
preserving the active workflow kind and the most recently presented candidate
list. It then trims the oldest recent turns if required. Full retained
candidates remain in server-owned state for deterministic resolution;
truncating the prompt does not delete them.

The planner records the prompt size reported by vLLM usage metadata when
available. The live rollout smoke test must measure a worst-case prompt
containing all candidate kinds, eight recent turns, one observation, and a
duplicate-read hint. The request must remain within the configured input budget.
The booking-agent service stays lightweight and does not load a second local
tokenizer solely for counting; structural caps protect runtime requests, while
vLLM-reported prompt tokens provide the authoritative measurement used to tune
those caps.

## Candidate Persistence

Every successful list read that returns selectable domain entities must update a
typed `CandidateList` in session state:

| Read tool | Candidate kind | Default TTL |
| --- | --- | --- |
| `list_clinics` | `clinic` | 10 minutes |
| `list_services` | `service` | 10 minutes |
| `list_clinic_services` | `service` | 10 minutes |
| `list_specialties` | `specialty` | 10 minutes |
| `list_doctor_schedules` | `schedule` | 90 seconds |
| `get_patient_appointments` | `appointment` | 10 minutes |

Candidate extraction is deterministic and tolerant of the backend's supported
list envelopes, such as a raw list or `{ "data": [...] }`. Each candidate keeps:

- The backend id.
- A compact user-visible label built only from backend fields.
- The original bounded item payload for deterministic slot resolution.
- Fetch and most-recent-presentation timestamps.

Each candidate list keeps at most 100 backend items in server-owned session
state. If a backend response exceeds that bound, the agent tells the user the
result was narrowed and asks for a filter rather than pretending the omitted
items do not exist.

The safe memory view exposes indexed labels and ids, never raw candidate
payloads. Selecting a clinic, service, specialty, schedule, or appointment by
index or an unambiguous demonstrative reference updates the matching structured
slots before planning.

Reference resolution chooses a candidate kind using this deterministic order:

1. An explicit entity phrase, such as "phòng khám thứ hai", "dịch vụ đó", or
   "chuyên khoa đầu tiên".
2. The next required slot for the active workflow.
3. The candidate list most recently presented to the user.

If more than one candidate kind still matches at the same priority, the
reference is ambiguous and the agent asks which list the user meant. It never
selects a candidate solely because another active list also contains the same
index.

An empty successful list replaces the matching candidate list with an empty
fresh list. A failed read does not erase the last successful candidates.

## Read-Tool Deduplication

Deduplication is turn-local. It prevents accidental planner loops without
blocking legitimate refreshes in later user turns.

Before executing a read tool, the graph creates a canonical signature from:

- Tool name.
- Schema-validated arguments after declared defaults have been materialized.
- Arguments serialized with stable key ordering and omitted null values.

The same schema validation and canonicalization function is used for both tool
execution and signature generation. Omitting a default-valued argument and
passing that default explicitly must produce the same signature. A schema
version that changes a default intentionally changes behavior and requires its
deduplication tests to be updated.

For example:

```text
list_clinics:{}
list_doctor_schedules:{"clinic_id":"...","work_date":"2026-06-20"}
```

If the same signature has already succeeded or failed during the current turn:

1. The tool is not executed again.
2. The duplicate attempt still consumes a planning step.
3. Metadata records `duplicate_read_blocked` and the canonical signature.
4. The next planner call receives a compact system hint containing the tools
   already attempted and instructing it to use observations, choose a different
   tool, answer, or ask one clarification.

If the final available planning step proposes a duplicate read, the graph stops
and asks for the single most useful missing detail. It does not call the tool or
silently extend the step budget.

If two consecutive planner actions propose duplicate read signatures in the
same turn, the graph stops immediately with the same safe clarification even
when planning steps remain. This avoids paying for repeated reasoning that is
not changing the action.

Read verification required by a mutation commit or timeout recovery is outside
the ReAct planning loop and is not blocked by turn-local planner deduplication.

## Planner Contract

The planner request includes:

- Safe session memory and indexed candidate lists.
- Read signatures attempted in the current turn.
- The remaining planning-step count.
- The selected adaptive reasoning mode.

The application continues to trust only parsed OpenAI-compatible tool calls or
the supported JSON fallback. Reasoning text never authorizes a mutation.

## Error Handling

- Qwen3.5 startup or HTTP failures return an explicit planner-unavailable
  response and metadata; there is no model fallback.
- Invalid tool arguments are treated as a blocked action and never executed.
- Candidate extraction failures preserve the observation for diagnostics but do
  not create partially grounded candidates.
- Duplicate reads are policy outcomes, not backend errors.
- Step-budget exhaustion remains a safe clarification response.

## Testing

Required tests:

- Qwen3.5 is the default model in settings and Docker Compose.
- Planner payload sends thinking disabled for a simple first planning call.
- Planner payload sends thinking enabled for a deterministic complex turn.
- No Qwen2.5 fallback path exists.
- Worst-case bounded prompt remains inside the configured input budget and
  records vLLM-reported prompt tokens when available.
- Prompt trimming preserves the active and most recently presented candidate
  kinds before removing lower-priority candidate views.
- Clinic, service, clinic-service, and specialty reads persist indexed
  candidates with catalog TTLs.
- Candidate references update clinic, service, and specialty slots.
- Ambiguous numeric references across candidate kinds ask for clarification;
  explicit entity phrases and the most recently presented list resolve
  deterministically.
- Raw-list and `{ "data": [...] }` responses produce equivalent candidates.
- Empty successful reads replace candidates; failed reads preserve them.
- Identical read signatures execute once per turn.
- Equivalent arguments with different key order are deduplicated.
- An omitted default argument and the same explicit default value produce the
  same read signature.
- Different read arguments are allowed in the same turn.
- A duplicate on the final step returns a safe missing-detail response.
- Two consecutive duplicate proposals stop early before the step budget is
  exhausted.
- A later user turn may execute the same read signature again.
- Timeout recovery and mutation verification reads are not blocked.
- Live Qwen3.5 smoke test validates one plain answer and one tool call.
- The Vietnamese read-only evaluation reports tool coverage, duplicate-block
  count, parse failures, reasoning-mode counts, candidate-reference resolution
  accuracy, prompt-token distribution, and P50/P95 latency.

Candidate-reference resolution accuracy is calculated only for scenarios with a
known expected candidate kind and id/index. It reports correct, ambiguous-safe,
and incorrectly-resolved outcomes separately so asking for clarification is not
counted as selecting the wrong backend entity.

## Rollout

1. Add adaptive reasoning and orchestration tests using fake planners and tools.
2. Update the model/runtime configuration to Qwen3.5-4B with no fallback.
3. Start Qwen3.5 locally and run focused live smoke tests, including the
   worst-case prompt-size measurement.
4. Run the existing safe read-only Vietnamese evaluation.
5. Keep Qwen3.5 as the only configured planner and use evaluation reports to
   guide prompt and orchestration improvements.
