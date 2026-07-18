#!/usr/bin/env python3
"""Local verification for public forms and admin workflows (no Docker)."""

from __future__ import annotations

import json
import os
import sys
import time
import uuid
from pathlib import Path
from urllib import error, request

API = os.environ.get("API_URL", "http://localhost:8080/api").rstrip("/")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@imaninvestment.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@123456")
RUN_ID = int(time.time())


def http(method: str, path: str, *, token: str | None = None, data=None, headers=None, expect=None):
    url = f"{API}{path}"
    req_headers = {"Accept": "application/json", **(headers or {})}
    if token:
        req_headers["Authorization"] = f"Bearer {token}"
    body = None
    if data is not None:
        if isinstance(data, bytes):
            body = data
        else:
            body = json.dumps(data).encode()
            req_headers["Content-Type"] = "application/json"
    req = request.Request(url, data=body, headers=req_headers, method=method)
    try:
        with request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            status = resp.status
            content_type = resp.headers.get("Content-Type", "")
            parsed = None
            if raw and "application/json" in content_type:
                parsed = json.loads(raw.decode())
            elif raw and method == "GET" and "octet-stream" not in content_type:
                parsed = raw.decode()
            if expect is not None and status != expect:
                raise AssertionError(f"{method} {path} expected {expect}, got {status}: {parsed or raw[:200]!r}")
            return status, parsed
    except error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        if expect is not None and exc.code == expect:
            return exc.code, detail
        raise AssertionError(f"{method} {path} failed with {exc.code}: {detail}") from exc


def multipart(fields: list[tuple[str, str, str, str]], files: list[tuple[str, str, bytes, str]]):
    boundary = f"----iman-verify-{uuid.uuid4().hex}"
    chunks: list[bytes] = []

    for name, value, content_type, _filename in fields:
        chunks.append(f"--{boundary}\r\n".encode())
        chunks.append(
            f'Content-Disposition: form-data; name="{name}"\r\nContent-Type: {content_type}\r\n\r\n'.encode()
        )
        chunks.append(value.encode())
        chunks.append(b"\r\n")

    for name, filename, content, content_type in files:
        chunks.append(f"--{boundary}\r\n".encode())
        chunks.append(
            f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n".encode()
        )
        chunks.append(content)
        chunks.append(b"\r\n")

    chunks.append(f"--{boundary}--\r\n".encode())
    body = b"".join(chunks)
    return body, {"Content-Type": f"multipart/form-data; boundary={boundary}"}


def login():
    _, data = http("POST", "/auth/login", data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, expect=200)
    assert data and data.get("token"), "login response missing token"
    return data["token"]


def verify_contact():
    payload = {
        "name": f"Verify Contact {RUN_ID}",
        "email": f"verify.contact.{RUN_ID}@example.com",
        "phone": "85212345678",
        "subject": "Local verification contact",
        "message": "Automated contact verification message.",
    }
    status, data = http("POST", "/public/contact", data=payload, expect=201)
    assert data.get("id"), f"contact submission missing id: {data}"
    print(f"PASS contact submission -> {data['id']} ({status})")


def verify_business_plan():
    plan = {
        "founderName": f"Verify Founder {RUN_ID}",
        "founderPosition": "CEO",
        "founderEmail": f"verify.bp.{RUN_ID}@example.com",
        "founderPhone": "85298765432",
        "country": "Hong Kong",
        "linkedinUrl": "https://linkedin.com/in/verify-founder",
        "website": "https://verify.example.com",
        "companyName": f"Verify Ventures {RUN_ID}",
        "industry": "Technology",
        "stage": "Seed",
        "teamSize": 8,
        "foundedDate": "2022-01-15",
        "fundingAmount": 500000,
        "revenue": 120000,
        "monthlyGrowth": 12.5,
        "companyDescription": "Automated business plan verification submission.",
    }
    body, headers = multipart(
        [("plan", json.dumps(plan), "application/json", "plan.json")],
        [("documents", f"verify-plan-{RUN_ID}.pdf", b"%PDF-1.4 verify plan", "application/pdf")],
    )
    status, data = http("POST", "/public/business-plans?submit=true", data=body, headers=headers, expect=201)
    assert data.get("id"), f"business plan submission missing id: {data}"
    print(f"PASS business plan submission -> {data['id']} ({status})")
    return data["id"]


def verify_job_application():
    _, jobs = http("GET", "/public/jobs?page=0&size=1", expect=200)
    content = jobs.get("content") or []
    assert content, "no published jobs available for application verification"
    job = content[0]
    application = {
        "firstName": "Verify",
        "lastName": f"Applicant{RUN_ID}",
        "email": f"verify.applicant.{RUN_ID}@example.com",
        "phone": "85255556666",
        "linkedinUrl": "https://linkedin.com/in/verify-applicant",
        "coverLetter": "Automated job application verification cover letter.",
    }
    body, headers = multipart(
        [("application", json.dumps(application), "application/json", "application.json")],
        [("resume", f"verify-resume-{RUN_ID}.pdf", b"%PDF-1.4 verify resume", "application/pdf")],
    )
    status, data = http("POST", f"/public/jobs/{job['id']}/applications", data=body, headers=headers, expect=201)
    assert data.get("id"), f"job application missing id: {data}"
    print(f"PASS job application -> {data['id']} for job {job['title']} ({status})")
    return data["id"]


def verify_admin_workflows(token: str, plan_id: str, applicant_id: str):
    _, plan = http("GET", f"/admin/business-plans/{plan_id}", token=token, expect=200)
    assert plan.get("companyName"), "business plan detail missing companyName"

    http(
        "PATCH",
        f"/admin/business-plans/{plan_id}/status",
        token=token,
        data={"status": "REVIEWING", "comment": "Verification status transition"},
        expect=200,
    )
    http(
        "POST",
        f"/admin/business-plans/{plan_id}/notes",
        token=token,
        data={"content": "Verification internal note"},
        expect=200,
    )
    _, notes = http("GET", f"/admin/business-plans/{plan_id}/notes", token=token, expect=200)
    assert isinstance(notes, list) and notes, "business plan notes not persisted"
    print(f"PASS business plan workflow -> {plan_id}")

    _, applicant = http("GET", f"/admin/applicants/{applicant_id}", token=token, expect=200)
    assert applicant.get("email"), "applicant detail missing email"

    http(
        "PATCH",
        f"/admin/applicants/{applicant_id}/status",
        token=token,
        data={"status": "REVIEWING", "comment": "Verification applicant review"},
        expect=200,
    )
    http(
        "POST",
        f"/admin/applicants/{applicant_id}/notes",
        token=token,
        data={"content": "Verification applicant note"},
        expect=200,
    )
    print(f"PASS applicant workflow -> {applicant_id}")

    portfolio_payload = {
        "name": f"Verify Portfolio {RUN_ID}",
        "industry": "Fintech",
        "description": "Automated portfolio verification record.",
        "website": "https://verify-portfolio.example.com",
        "imageUrl": "",
        "displayOrder": 99,
        "featured": False,
        "status": "DRAFT",
    }
    _, created = http("POST", "/admin/portfolio", token=token, data=portfolio_payload, expect=201)
    portfolio_id = created["id"]
    http(
        "PUT",
        f"/admin/portfolio/{portfolio_id}",
        token=token,
        data={**portfolio_payload, "description": "Updated verification portfolio record."},
        expect=200,
    )
    http("DELETE", f"/admin/portfolio/{portfolio_id}", token=token, expect=204)
    print(f"PASS portfolio CRUD -> {portfolio_id}")

    job_payload = {
        "title": f"Verify Role {RUN_ID}",
        "slug": f"verify-role-{RUN_ID}",
        "department": "Operations",
        "location": "Hong Kong",
        "type": "FULL_TIME",
        "status": "DRAFT",
        "description": "Automated job verification record.",
        "responsibilities": "Run verification tasks.",
        "requirements": "Attention to detail.",
        "benefits": "Learning culture.",
        "experience": "2+ years",
        "education": "Bachelor",
        "salaryMin": 40000,
        "salaryMax": 60000,
        "metaTitle": "Verify Role",
        "metaDescription": "Verification job posting",
    }
    _, created_job = http("POST", "/admin/jobs", token=token, data=job_payload, expect=201)
    job_id = created_job["id"]
    http(
        "PUT",
        f"/admin/jobs/{job_id}",
        token=token,
        data={**job_payload, "description": "Updated verification job record."},
        expect=200,
    )
    http("DELETE", f"/admin/jobs/{job_id}", token=token, expect=204)
    print(f"PASS job CRUD -> {job_id}")


def main():
    print(f"Verifying against {API}")
    token = login()
    print("PASS admin login")

    verify_contact()
    plan_id = verify_business_plan()
    applicant_id = verify_job_application()
    verify_admin_workflows(token, plan_id, applicant_id)
    print("ALL LOCAL VERIFICATION CHECKS PASSED")


if __name__ == "__main__":
    try:
        main()
    except AssertionError as exc:
        print(f"FAIL {exc}", file=sys.stderr)
        sys.exit(1)
