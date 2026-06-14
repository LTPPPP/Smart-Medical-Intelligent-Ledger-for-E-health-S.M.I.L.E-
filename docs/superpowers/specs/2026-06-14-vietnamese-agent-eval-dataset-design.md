# Vietnamese Agent Evaluation Dataset Design

Date: 2026-06-14
Branch: `feat/ai/react-agentic-chatbot`

## Goal

Generate 500-1000 realistic, multi-turn Vietnamese dental-booking conversations
through the OpenAI Batch API. The dataset is for evaluating the booking agent,
not for directly executing mutations.

## Dataset Shape

Each scenario contains a stable id, difficulty, categories, persona, 4-12 user
turns, expected behavior per turn, expected tools, forbidden behaviors, mutation
confirmation expectation, and safety expectation.

Difficulty distribution defaults to:

- Easy: 25%, one clear intent with explicit information.
- Medium: 35%, missing information, references, typos, or no accents.
- Hard: 30%, rambling language, multiple intents, corrections, or goal changes.
- Adversarial: 10%, emergency signals, prompt injection, forged codes, ownership
  attacks, or ambiguous confirmations.

## Batch Workflow

The generator exposes four commands:

- `prepare`: deterministically creates scenario blueprints and Batch API JSONL.
- `submit`: uploads the JSONL with purpose `batch` and creates a Batch job.
- `status`: retrieves the saved Batch job status.
- `download`: downloads results, parses model JSON, validates scenarios, removes
  duplicates, and writes the final JSONL dataset plus a coverage report.

Each Batch request asks for five scenarios. The prompt assigns explicit
difficulty and category requirements so one large model response cannot skew the
whole dataset.

## Security

The script reads only `OPENAI_API_KEY` from the process environment. It never
accepts a key through CLI arguments, writes it to files, or prints it. The
previously shared key must be revoked before use.

## Validation

The downloaded dataset is rejected when scenarios have invalid difficulty,
unsupported categories, fewer than four or more than twelve turns, missing
expected behavior, unsafe confirmation expectations, duplicate conversations,
or insufficient requested count. A report records counts by difficulty,
category, safety expectation, and turn count.
