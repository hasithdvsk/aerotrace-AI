"""
AeroTrace AI - App Namespace Entrypoint
Re-exports the core microservice application from main.py
"""

import sys
from pathlib import Path

# Ensure root of apps/ai-engine is on sys.path
ai_engine_root = Path(__file__).resolve().parent.parent
if str(ai_engine_root) not in sys.path:
    sys.path.insert(0, str(ai_engine_root))

from main import app

__all__ = ["app"]
