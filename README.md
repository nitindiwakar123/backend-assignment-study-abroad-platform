# Waygood Study Abroad Candidate Evaluation Starter

This repository is a starter assignment for backend-focused MERN candidates interviewing with Waygood.

Waygood's public website positions the business around helping students discover universities, compare options, plan budgets, and navigate their study-abroad journey with AI-assisted tools and partner networks. This starter mirrors that business context by focusing on student discovery, recommendation, and application tracking.

## Business Scenario

You are joining the engineering team working on a study-abroad platform for students and counselors.

The product already has:

- a basic university and program catalog
- seeded sample data for students, universities, programs, and applications
- a minimal React dashboard shell
- starter backend architecture with Express, Mongoose, controllers, services, and middleware

The product is still missing critical engineering work needed for a real candidate-ready release.

## Your Assignment

Build on top of this starter and complete the platform features below.

### Required Tasks

1. Implement secure authentication

- Complete `POST /api/auth/register`
- Complete `POST /api/auth/login`
- Add a protected `GET /api/auth/me`
- Use JWT-based authentication
- Store passwords securely using hashing
- Support roles for `student` and `counselor`

2. Complete advanced university and program discovery

- Extend `GET /api/universities` and `GET /api/programs`
- Add filtering by country, intake, degree level, budget, scholarship availability, and search term
- Add pagination metadata and sorting options
- Make the response format consistent and frontend-friendly

3. Build a recommendation engine using MongoDB aggregation

- Improve `GET /api/recommendations/:studentId`
- Use MongoDB aggregation to recommend relevant programs for a student
- Consider preferred countries, budget, field of interest, intake, and IELTS score
- Return top matches with a short explanation of why each result matched

4. Implement the application workflow

- Complete `POST /api/applications`
- Complete `PATCH /api/applications/:id/status`
- Prevent duplicate applications for the same student, program, and intake
- Enforce valid status transitions
- Record a timeline/history entry when status changes

5. Add caching and performance improvements

- Cache `GET /api/universities/popular` and/or dashboard summary responses
- You may use Redis or improve the provided in-memory cache
- Add or document MongoDB indexes that improve the most important queries
- Keep performance tradeoffs clear in code comments or README notes

6. Add testing and developer documentation

- Add tests for at least 2 important API flows
- Include at least 1 edge-case test
- Update this README with any assumptions, setup steps, and architecture notes needed to review your submission

### Bonus Tasks

- Integrate an AI endpoint for study-plan suggestions, SOP helper prompts, or shortlist summaries
- Dockerize the backend and database setup
- Improve the React dashboard to consume your new APIs cleanly
- Add rate limiting, request logging, or role-based access improvements

## What We Will Evaluate

- Backend architecture and code organization
- API design, validation, and error handling
- MongoDB query quality, aggregation usage, and indexing awareness
- Performance thinking, including caching and response design
- Code readability, maintainability, and naming
- Testing depth and practical engineering judgment
- How well your solution reflects a real study-abroad product workflow

## Suggested Timebox

A strong submission can usually be completed in 6-8 focused hours. We care more about thoughtful engineering tradeoffs than feature volume.

## Suggested Submission Expectations

- Keep the solution realistic and production-minded
- Favor clean, explainable code over unnecessary complexity
- If you make assumptions, document them
- If you skip a bonus feature, that is okay
- Share your repository, setup instructions, and any sample credentials or environment notes needed to review

## Starter Project Structure

```text
.
|-- backend
|   |-- src
|   |   |-- config
|   |   |-- controllers
|   |   |-- data
|   |   |-- middleware
|   |   |-- models
|   |   |-- routes
|   |   |-- scripts
|   |   |-- services
|   |   `-- utils
|-- frontend
|   `-- src
`-- docs
```

## Getting Started

### 1. Backend setup

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

### Tests

```bash
cd backend
npm test
```

## API and architecture notes

- **Authentication:** register only creates `student` accounts to prevent role escalation. JWTs carry an issuer and audience and protected APIs load the current account on every request. Passwords are bcrypt-hashed with 12 rounds; never expose the password field.
- **Discovery:** `GET /api/universities` supports `country`, `partnerType`, `scholarshipAvailable`, `q`, `sortBy`, `page`, and `limit`. `GET /api/programs` supports `country`, `degreeLevel`, `intake`, `field`, `maxTuition`, `scholarshipAvailable`, `q`, `sortBy`, `page`, and `limit`. Both return `{ success, data, meta }`; limits are capped at 50 and input is validated before constructing a query.
- **Access control:** students can only list, update, create, and obtain recommendations for themselves. Counselors can access all applications and may create an application for a supplied `studentId`.
- **Applications:** creation derives university and destination from the program (rather than trusting client input), validates the intake, and has a database unique index on `(student, program, intake)`. Status changes use the transition map and append an immutable-style timeline event.
- **Caching:** with `REDIS_URL` set, popular universities and dashboard overview use Redis `GET/SET EX`; without Redis the same TTL cache falls back to memory for development. Cache is deliberately not used for authenticated data and is invalidated after application writes. Redis makes cache hits shareable between API instances; the fallback trades that for zero local setup.
- **Indexes/trade-offs:** catalogue compound indexes prioritize equality filters before tuition range and sorting. The application uniqueness index is both a correctness guarantee under concurrent requests and the principal student-history lookup access pattern. Recommendations score in an aggregation pipeline and limit in MongoDB, avoiding a broad catalogue transfer to Node.

## Environment Variables

See `backend/.env.example`.

## Seeded Data Included

The seed script creates sample:

- students with profile preferences
- universities across key study-abroad destinations
- programs with tuition, intake, and IELTS requirements
- applications with mixed statuses

## Sample Seed Credentials

After running the seed script, you can use:

- `aarav@example.com` / `Candidate123!`
- `sara@example.com` / `Candidate123!`
- `counselor@example.com` / `Candidate123!`

## Notes For Candidates

- Some routes are intentionally incomplete
- Some services are intentionally simple and should be improved
- The codebase is structured to show expected engineering direction, not to be finished
- You can refactor any part of the starter if your approach is better

## Candidate-Friendly Deliverables

Along with this README, a Word assignment brief is available at:

- `docs/Waygood_Candidate_Assignment.docx`

## Reference Context Used For This Assignment Design

- Waygood website: student discovery, AI tools, calculators, and partner-university positioning
- Job description: backend APIs, MongoDB aggregation, performance optimization, caching, and AI integration
