# Testcase Generation Agent – High-Level Technical Architecture

## Overview
This document defines the high-level technical architecture and system design for an **AI-powered Testcase Generation Agent**.  
The design is **API-first**, **human-in-the-loop**, **non-hallucinatory**, and optimized for **enterprise-scale QA organizations**.

---

## 1. API-First Architecture

### 1.1 Principles
- All capabilities exposed via versioned REST APIs
- Stateless services
- Web UI, Copilot, CI/CD act only as consumers
- Human approval and confidence are first-class citizens

### 1.2 Core API Domains

#### Ingestion APIs
- /ingestion/requirements
- /ingestion/ui-specs
- /ingestion/recordings
- /ingestion/test-assets
- /ingestion/code-pv
- /ingestion/defects
- /ingestion/docs
- /ingestion/release-notes

Each ingestion:
- Creates a versioned snapshot
- Triggers V or PV vectorization
- Assigns source trust score

#### Retrieval & Reasoning APIs
- /context/retrieve
- /impact/analyze
- /risk/evaluate

Retrieval is confidence-weighted with fallback hierarchy:
Requirements → UI → Defects → Code PV

#### Testcase Generation APIs
- /tests/generate/new
- /tests/generate/affected
- /tests/generate/e2e

Canonical testcase model supports:
- Manual format
- Automation-ready (BDD/Gherkin)
- Evidence references
- Confidence score

#### Human-in-the-Loop APIs
- /review/source-confirmation
- /review/testcase-approval
- /review/e2e-approval
- /confidence/update

#### Export & Integration APIs
- /export/jira
- /export/testrail
- /export/files
- /copilot/context

Low-confidence outputs trigger additional validation.

---

## 2. Database Layer

### 2.1 Relational Database (PostgreSQL)
Stores:
- User stories, features, releases
- Testcases (canonical model)
- Approval history
- Confidence scores and factors
- Traceability metadata
- Tenant, RBAC, source permissions

### 2.2 Vector Stores

#### Business Intent Vector Store (V)
- Requirements
- UI specs
- Grooming insights
- Release notes
- Technical docs

#### Technical Signal Vector Store (V + PV)
- Defect root-cause patterns
- API specs
- Structural code changes (no logic)

Retrieval is weighted by:
- Source trust
- Freshness (confidence decay)
- Human approval history

### 2.3 Snapshot & Versioning
- Immutable release-level snapshots
- Used for audit, rollback, and reproducibility

---

## 3. Web Layer

### 3.1 Web UI Responsibilities
- Story and feature selection
- Evidence review
- Testcase approval
- Confidence visualization
- Diff view for affected tests
- E2E flow review

### 3.2 Key Screens
- Story Intelligence View
- Testcase Review Board
- E2E Risk Dashboard

### 3.3 Copilot Integration
- Copilot consumes same APIs
- Receives structured, approved context
- Cannot bypass human approval

---

## 4. Simple Design Summary

### Key Principles
- Single canonical testcase model
- Confidence-driven behavior
- Human-in-the-loop at multiple checkpoints
- No full code logic embedding
- Clear separation of concerns

### Phase-Based Evolution
**Phase-1**
- Balanced MVP
- Risk-driven E2E
- Approval mandatory
- Confidence-weighted outputs

**Phase-2+**
- Automation feedback learning
- Defect catch-rate optimization
- Expanded Copilot autonomy (governed)

---

## End of Document
