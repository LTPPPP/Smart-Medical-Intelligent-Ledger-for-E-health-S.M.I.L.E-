from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


def _load_script():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "run_agent_load_check.py"
    spec = importlib.util.spec_from_file_location("run_agent_load_check", script_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_load_check_summary_reports_success_rate_and_latency():
    script = _load_script()
    results = [
        script.LoadTurnResult(ok=True, status_code=200, latency_ms=10.0, flow="lookup", actions=["get_patient_appointments"]),
        script.LoadTurnResult(ok=False, status_code=502, latency_ms=30.0, flow=None, actions=[], error="BadGateway"),
    ]

    summary = script.summarize({"ok": True}, results, request_count=2, concurrency=2)

    assert summary["success_rate"] == 0.5
    assert summary["p50_latency_ms"] == 10.0
    assert summary["p95_latency_ms"] == 30.0
    assert summary["failed_count"] == 1
