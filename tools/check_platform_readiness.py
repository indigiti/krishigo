#!/usr/bin/env python3
"""M25 fail-closed, offline release-readiness inventory. Never deploys or reads secrets."""
from __future__ import annotations
import json
from pathlib import Path
from datetime import datetime,timezone
from typing import Any

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"apps/api-php"
WEB=ROOT/"apps/web/src"

ARTIFACTS={
 "schema_002":BASE/"database/migrations/002_platform_foundations.sql",
 "schema_003":BASE/"database/migrations/003_trade_lifecycle.sql",
 "m26_trade_journey":BASE/"src/Production/TradeJourney.php",
 "knowledge_api":BASE/"src/Production/KnowledgeApi.php",
 "commerce_api":BASE/"src/Production/CommerceApi.php",
 "engagement_api":BASE/"src/Production/EngagementApi.php",
 "platform_common":BASE/"src/Production/PlatformCommon.php",
 "protected_entrypoint":BASE/"public/index.php",
 "production_integration_test":BASE/"tests/production_integration.py",
 "platform_mysql_integration_test":BASE/"tests/platform_integration.py",
 "platform_web_workspace":WEB/"features/PlatformOperations.tsx",
 "knowledge_tracker":ROOT/"KNOWLEDGE.md",
}
EXTERNAL_GATES={
 "farmer_verified_identity":"Manual staff review is not email/phone/identity-provider verification",
 "live_mandi_feed":"Approved data access, data contract, freshness and error integration missing",
 "live_imd_weather_feed":"Provider access and warning delivery not implemented",
 "government_schemes":"Official versioned current scheme sources and review missing",
 "registered_crop_input_catalogue":"Current Indian crop-use registrations and labels not independently verified",
 "ocr_worker":"Actual OCR processor, privacy, upload scanning and quality evaluation missing",
 "generative_ai":"No evaluated, source-grounded generation engine or agronomist escalation service",
 "whatsapp_email":"No official connector, message templates, consent proof, delivery receipts or retry worker",
 "payments":"No payment gateway, settlement, refunds, licensing or financial approvals",
 "trade_fulfilment":"Transport/warehouse booking and dispute handling not connected",
 "multi_tenant_acceptance":"Tenant isolation, backup/restore and production security review outstanding",
 "cloudways_hosted_qa":"No hosted URL, runtime, PHP process or database acceptance recorded",
 "production_observability":"SLOs, alarms, log retention, security monitoring and on-call not accepted",
 "legal_and_agronomy_review":"Professional review, rights and regulatory approvals outstanding",
}
def report()->dict[str,Any]:
 checks={k:{"present":p.is_file(),"path":str(p.relative_to(ROOT))} for k,p in ARTIFACTS.items()}
 source=(BASE/"public/index.php").read_text(encoding="utf-8") if (BASE/"public/index.php").exists() else ""
 privacy=(BASE/"src/Production/EngagementApi.php").read_text(encoding="utf-8") if (BASE/"src/Production/EngagementApi.php").exists() else ""
 defensive={
  "production_is_opt_in":"KRISHIGO_API_MODE') === 'production'" in source,
  "default_demo_separate":"kg_fixture(" in source,
  "no_claimed_real_ocr":"'real_ocr'=>false" in privacy,
  "no_claimed_generating_ai":"'generative_ai'=>false" in privacy,
  "no_claimed_payment":"'payments'=>false" in privacy,
  "no_claimed_whatsapp":"'whatsapp_delivery'=>false" in privacy,
 }
 passed=all(x["present"] for x in checks.values()) and all(defensive.values())
 return {
  "report_version":1,
  "generated_at":datetime.now(timezone.utc).isoformat(),
  "mode":"offline_source_inspection_only",
  "repository_code_checks_passed":passed,
  "production_launch_authorized":False,
  "live_service_verified":False,
  "artifact_checks":checks,
  "defensive_guards":defensive,
  "blocked_external_gates":EXTERNAL_GATES,
  "instructions":"Treat code success as build readiness only. A separate authorized, audited hosted acceptance process is mandatory."
 }
def main():
 result=report()
 output=ROOT/"reports/m25-platform-readiness.json"
 output.parent.mkdir(exist_ok=True,parents=True)
 output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps({"code_checks_passed":result["repository_code_checks_passed"],"launch_authorized":False,
     "blocked_gates":len(result["blocked_external_gates"]),"report":str(output.relative_to(ROOT))}))
 if not result["repository_code_checks_passed"]:raise SystemExit(1)
if __name__=="__main__":main()
