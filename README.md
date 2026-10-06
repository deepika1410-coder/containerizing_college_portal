# CampusFlow
### Smart College Portal — Reliable, Scalable & DevOps Ready

CampusFlow is an enterprise full-stack college portal web application built for peak registration concurrency, 24/7 reliability, real-time communication, and automated Kubernetes orchestration with rollback capabilities.

---

## 1. Architectural Highlights

- **Single Relational Database (PostgreSQL)**: Eliminates environment drift across development, testing, staging, and production.
- **Atomic Concurrency Protection**: High-concurrency course registrations utilize PostgreSQL row-level locks (`SELECT ... FOR UPDATE` and atomic conditional increments `WHERE enrolled_count < max_seats`) to prevent race conditions during seat opening surges.
- **Real-Time Push Notifications**: Powered by Socket.IO over authenticated WebSockets with JWT validation, delivering instant alert popups, category filters, and persistent notification badges.
- **Cryptographic Password Reset**: Zero plaintext token storage; utilizes crypto-secure hashes, single-use invalidation, and strict expiration timestamps.
- **Backend Result Calculation & Integrity**: Server-side mathematical computation of total marks, grades, grade points, semester GPA, and cumulative CGPA. Administrative locking safeguards protect finalized results.
- **Production Observability**: Meaningful health checks (`/health`, `/live`, and `/ready` with live PostgreSQL database ping) and `/metrics` exposing Prometheus telemetry via `prom-client`.
- **Zero-Downtime Rollback CI/CD**: Pipelines verify deployment rollouts with `kubectl rollout status` and trigger automatic rollbacks (`kubectl rollout undo`) if health probes fail.
- **Kubernetes Autoscaling**: HorizontalPodAutoscaler (HPA) configured for 2 to 10 pods, supported by the Kubernetes Metrics Server.

---

## 2. Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client |
| **Backend** | Node.js, Express, Socket.IO, `pg` (node-postgres), `prom-client`, Helmet, CORS, Rate-Limiting |
| **Database** | PostgreSQL 16 (Normalized Relational Schema, ACID Transactions) |
| **Containerization** | Docker, Multi-Stage Builds, Docker Compose |
| **Orchestration** | Kubernetes, Metrics Server, HorizontalPodAutoscaler (HPA), Ingress |
| **CI/CD** | GitHub Actions, Jenkins Declarative Pipeline, Automated Rollback |
| **Testing** | Jest, Supertest, Playwright (E2E), k6 (Load & Concurrency Testing) |
| **Observability** | Prometheus, Grafana |

---

## 3. Visual Design System

The user interface follows a modern mobile-first aesthetic with rounded cards, subtle shadows, and pill-shaped navigation:

| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| **Primary** | `#4F7185` | Muted Blue/Teal brand accents, active pills |
| **Secondary** | `#DCEBF0` | Soft blue secondary surfaces, tag backgrounds |
| **Background** | `#F7FAFB` | Clean light background |
| **White** | `#FFFFFF` | Rounded cards, elevated surfaces |
| **Dark Text** | `#172B36` | High-contrast readable typography |
| **Muted Text** | `#6B7F89` | Secondary captions, timestamps |
| **Success** | `#4CAF7D` | High attendance, approved registrations |
| **Warning** | `#E9A84C` | Low seat warnings, result alerts |
| **Danger** | `#D96565` | Low attendance (<75%), errors, dropped courses |

---

## 4. Demo Login Credentials

The application provides **1-Click Demo Quick-Access Pills** on the login screen. You can also log in manually with the following credentials:

| Role | Email | Password | Name / Details |
| :--- | :--- | :--- | :--- |
| **STUDENT** | `student@campusflow.edu` | `Password123!` | Alex Rivera (Reg: `2024CS101`, Sem 5, CSE) |
| **STUDENT 2** | `maya@campusflow.edu` | `Password123!` | Maya Lin (Reg: `2024CS102`, Sem 5, CSE) |
| **STUDENT 3** | `rohit@campusflow.edu` | `Password123!` | Rohit Sharma (Reg: `2024EC101`, Sem 3, ECE) |
| **FACULTY** | `faculty@campusflow.edu` | `Password123!` | Prof. Alan Turing (Dept Head & Assoc. Prof, CSE) |
| **FACULTY 2** | `shannon@campusflow.edu` | `Password123!` | Prof. Claude Shannon (Systems Specialist, ECE) |
| **ADMIN** | `admin@campusflow.edu` | `Password123!` | Dr. Eleanor Vance (Dean & DevOps Admin) |

---

## 5. Local Quickstart

### Prerequisites
- Node.js LTS (v20+) and npm
- (Optional for containers): Docker & Docker Compose

### Step 1: Start Backend API Service
```bash
cd backend
npm install
npm start
```
The backend initializes the PostgreSQL schema and seeds realistic demo data automatically.
- **API URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`
- **Readiness Probe**: `http://localhost:5000/ready`
- **Prometheus Metrics**: `http://localhost:5000/metrics`

### Step 2: Start Frontend Web Client
```bash
cd frontend
npm install
npm run dev
```
- **Web Portal URL**: `http://localhost:5173`

---

## 6. Docker & Docker Compose Orchestration

To run the complete production topology including PostgreSQL 16, Backend, Frontend, Prometheus, and Grafana:

```bash
# Build and launch all containerized services
docker compose up --build -d

# Check running services
docker compose ps

# View backend logs
docker compose logs -f backend
```

### Container Endpoints:
- **Frontend Portal**: `http://localhost:80`
- **Backend API**: `http://localhost:5000`
- **Prometheus Dashboard**: `http://localhost:9090`
- **Grafana Dashboards**: `http://localhost:3000` (User: `admin`, Pass: `campusflow_admin`)
- **PostgreSQL Database**: `localhost:5432`

---

## 7. Automated Testing Suite

### Unit, Integration & Concurrency Tests
Run the comprehensive 20-test automated suite covering authentication, RBAC boundaries, course registration row-level locking, attendance calculations, backend GPA computation, and real-time notifications:

```bash
cd backend
npm test
```

### Browser End-to-End Tests (Playwright)
```bash
cd e2e
npx playwright test
```

### Concurrency & High-Load Performance Tests (k6)
Simulate realistic registration surges and exam release traffic:
```bash
# Scenario 1: Normal steady-state academic traffic
k6 run load-tests/normal-traffic.js

# Scenario 2: High-concurrency registration opening spike (Seat-racing)
k6 run load-tests/registration-spike.js

# Scenario 3: Exam results release surge
k6 run load-tests/results-release-spike.js
```

---

## 8. Kubernetes Deployment & Automated Rollback

### Architecture
```
Kubernetes Cluster
  ├── Ingress (portal.campusflow.edu)
  ├── Metrics Server (01-metrics-server.yaml)
  ├── HorizontalPodAutoscaler (min: 2, max: 10 pods)
  ├── Frontend Deployment (2 replicas, rolling updates)
  ├── Backend Deployment (2 replicas, probes: /ready, /live)
  └── Managed PostgreSQL / StatefulSet (PersistentVolumeClaim)
```

### Apply Kubernetes Manifests
```bash
kubectl apply -f kubernetes/00-namespace.yaml
kubectl apply -f kubernetes/01-metrics-server.yaml
kubectl apply -f kubernetes/02-configmaps-secrets.yaml
kubectl apply -f kubernetes/03-postgres-statefulset.yaml
kubectl apply -f kubernetes/04-backend-deployment.yaml
kubectl apply -f kubernetes/05-frontend-deployment.yaml
kubectl apply -f kubernetes/06-ingress.yaml
kubectl apply -f kubernetes/07-hpa.yaml
```

### Automated Rollback Mechanism
When a deployment rollout is triggered:
1. `kubectl rollout status deployment/campusflow-backend -n campusflow --timeout=120s`
2. If readiness probes fail on `/ready` (e.g. database disconnect or application failure), CI/CD initiates automatic rollback:
   ```bash
   kubectl rollout undo deployment/campusflow-backend -n campusflow
   kubectl rollout undo deployment/campusflow-frontend -n campusflow
   ```
3. Deployment logs report: `DEPLOYMENT FAILED — AUTOMATIC ROLLBACK COMPLETED`.

---

## 9. API Reference

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public | Authenticate user & return JWT token |
| `/api/auth/forgot-password` | `POST` | Public | Generate crypto password reset token |
| `/api/auth/reset-password` | `POST` | Public | Validate token & update password |
| `/api/auth/me` | `GET` | Authenticated | Retrieve authenticated user profile |
| `/api/courses` | `GET` | Authenticated | Browse courses with department/semester filters |
| `/api/courses` | `POST` | ADMIN | Create new course with seat quota |
| `/api/registrations` | `POST` | STUDENT | Concurrency-protected course enrollment |
| `/api/registrations/drop` | `POST` | STUDENT | Drop registered course atomically |
| `/api/attendance/my` | `GET` | STUDENT | View subject-wise & overall attendance percentage |
| `/api/attendance/mark` | `POST` | FACULTY, ADMIN | Mark session attendance with student roster |
| `/api/results/my` | `GET` | STUDENT | View verified results & calculated GPA/CGPA |
| `/api/results/marks` | `POST` | FACULTY, ADMIN | Enter internal/external marks with grade calc |
| `/api/results/publish-status` | `POST` | ADMIN | Publish or lock examination results |
| `/api/notifications` | `GET` | Authenticated | Retrieve alerts with unread badge count |
| `/api/notifications/broadcast`| `POST` | FACULTY, ADMIN | Dispatch real-time WebSocket alert to campus |
| `/api/timetable` | `GET` | Authenticated | Weekly class schedule grouped by day |
| `/api/admin/dashboard` | `GET` | ADMIN | Overall campus telemetry and stats |
| `/api/admin/audit-logs` | `GET` | ADMIN | Immutable security event stream |
| `/health` | `GET` | Public | Process health heartbeat |
| `/ready` | `GET` | Public | Database readiness probe |
| `/metrics` | `GET` | Prometheus | Prometheus telemetry scraping endpoint |

---

## 10. Deployment Truth & Production Cloud Status

- **Local Verification**: 100% verified and operational. Backend and Frontend start cleanly, pass all 20 automated tests, build production bundles, and communicate over REST and WebSockets.
- **Production Cloud Deployment**: Cloud deployment is currently **pending cloud provider credentials** (e.g. AWS EKS, Google GKE, Azure AKS, or DigitalOcean Kubernetes cluster).
- **Exact Cloud Steps Remaining**:
  1. Set cluster context: `aws eks update-kubeconfig --name <cluster-name> --region <region>`
  2. Populate production database secret in `kubernetes/02-configmaps-secrets.yaml` with your managed PostgreSQL URL (e.g., Amazon RDS / Supabase).
  3. Execute `kubectl apply -f kubernetes/` to provision all services, ingresses, and autoscalers.
