import json
import subprocess
import sys
from pathlib import Path


def test_qwen_fit_benchmark_script_runs_from_service_root():
    service_root = Path(__file__).resolve().parents[1]

    result = subprocess.run(
        [sys.executable, "scripts/benchmark_qwen35_fit.py"],
        cwd=service_root,
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    payload = json.loads(result.stdout)
    assert [candidate["name"] for candidate in payload["candidates"]] == [
        "Qwen/Qwen3.5-4B",
        "Qwen/Qwen3.5-9B",
    ]


def test_live_core_check_script_exposes_help_from_service_root():
    service_root = Path(__file__).resolve().parents[1]

    result = subprocess.run(
        [sys.executable, "scripts/live_core_check.py", "--help"],
        cwd=service_root,
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0
    assert "--agent-url" in result.stdout
    assert "--patient-id" in result.stdout
