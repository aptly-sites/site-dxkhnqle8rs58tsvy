"""Provision the private feedback binding for the All 3 preview only."""
import json
import os
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

PROJECT = "site-dxkhnqle8rs58tsvy"
DATABASE = "all3-realty-website-feedback"
BINDING = "ALL3_FEEDBACK_DB"
if os.environ["GITHUB_REPOSITORY"] != "aptly-sites/" + PROJECT:
    raise SystemExit("This setup is restricted to All 3 Realty.")


def api(path, method="GET", data=None):
    base = "https://api.cloudflare.com/client/v4/accounts/" + os.environ["CLOUDFLARE_ACCOUNT_ID"]
    req = Request(base + path, method=method,
                  headers={"Authorization": "Bearer " + os.environ["CLOUDFLARE_API_TOKEN"],
                           "Content-Type": "application/json"},
                  data=None if data is None else json.dumps(data).encode())
    try:
        with urlopen(req, timeout=30) as resp:
            payload = json.load(resp)
    except HTTPError as err:
        issues = json.load(err).get("errors", [])
        raise SystemExit(f"{method} {path} failed ({err.code}): " +
                         ", ".join(str(i.get("code")) for i in issues)) from None
    if not payload.get("success"):
        raise SystemExit(f"{method} {path} failed.")
    return payload["result"]


def bindings():
    config = api("/pages/projects/" + PROJECT)["deployment_configs"]["production"]
    return config.get("d1_databases") or {}


existing = bindings()
matches = [d for d in api("/d1/database?name=" + DATABASE) if d["name"] == DATABASE]
if len(matches) > 1:
    raise SystemExit("Multiple matching databases. No changes applied.")
if existing.get(BINDING) and (not matches or existing[BINDING]["id"] != matches[0]["uuid"]):
    raise SystemExit("Unexpected existing binding. No changes applied.")
database = matches[0] if matches else api("/d1/database", "POST", {"name": DATABASE})
db_id = database["uuid"]
sql = Path("migrations/0001_all3_feedback.sql").read_text()
api("/d1/database/" + db_id + "/query", "POST", {"sql": sql})
if BINDING not in existing:
    current = bindings()
    if current != existing:
        raise SystemExit("Bindings changed during setup. Recheck before continuing.")
    api("/pages/projects/" + PROJECT, "PATCH", {"deployment_configs": {
        "production": {"d1_databases": {**current, BINDING: {"id": db_id}}}}})
if bindings().get(BINDING, {}).get("id") != db_id:
    raise SystemExit("Could not confirm storage binding.")
print("Verified All 3 Realty private feedback storage binding.")
