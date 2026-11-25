# MailScheduler

A full-stack email scheduling application that lets users connect email
senders, compose and schedule bulk emails, monitor delivery status, and
apply sending limits. The backend persists email records in MySQL and
uses Redis + BullMQ to process scheduled jobs in a separate worker
process.

> **Project status:** Core scheduling, queue processing, SMTP delivery,
> rate limiting, dashboard views, and supporting integrations have been
> implemented and tested during development. Review the testing and
> limitations sections before treating this project as production-ready.

## Features

### Frontend

-   React + TypeScript interface styled with Tailwind CSS.
-   Google OAuth-based sign-in.
-   Dashboard views for scheduled, sent, and failed emails.
-   Compose and schedule emails for a selected sender.
-   Import recipient lists from CSV or TXT files.
-   Configure the start time, delay between messages, and hourly sending
    limit.
-   Sender management and email status monitoring.
-   Loading, empty, and error states.

### Backend

-   Node.js, Express, and TypeScript REST API.
-   MySQL persistence through Knex.js.
-   Redis-backed BullMQ delayed jobs.
-   Separate worker process for email delivery.
-   Nodemailer SMTP integration, including Ethereal Email for testing.
-   Sender-specific SMTP configuration.
-   Minimum delay between sends and hourly sending limits.
-   Elasticsearch integration for email indexing and search.
-   Slack OAuth and notifications for email events.
-   Bull Board for queue inspection.
-   Background outbox/recovery processing for work that must be retried
    after interruptions.
-   Zod-based request validation.

## Technology Stack

  Layer                 Technology
  --------------------- ---------------------------------
  Frontend              React, TypeScript, Tailwind CSS
  Backend               Node.js, Express, TypeScript
  Database              MySQL, Knex.js
  Queue                 BullMQ
  Queue storage         Redis
  Email delivery        Nodemailer, SMTP
  Test email service    Ethereal Email
  Search and indexing   Elasticsearch
  Authentication        Google OAuth, Passport
  Session storage       Express Session, Redis
  Notifications         Slack OAuth, Slack Web API
  Queue dashboard       Bull Board
  Validation            Zod

## Architecture

``` text
                  ┌─────────────────────────┐
                  │   React + TypeScript    │
                  │       Frontend          │
                  └────────────┬────────────┘
                               │ HTTP / API
                               ▼
                  ┌─────────────────────────┐
                  │    Express API          │
                  │  Authentication,        │
                  │  validation, scheduling │
                  └──────┬──────────┬───────┘
                         │          │
                 Persist │          │ Enqueue delayed jobs
                         ▼          ▼
                  ┌───────────┐  ┌────────────────┐
                  │  MySQL    │  │ Redis + BullMQ │
                  │ email and │  │ delayed jobs   │
                  │ batch data│  └───────┬────────┘
                  └───────────┘          │
                                         ▼
                                ┌─────────────────┐
                                │ Email Worker    │
                                │ concurrency     │
                                │ and rate limits │
                                └───┬─────────┬───┘
                                    │         │
                                    ▼         ▼
                              ┌─────────┐ ┌──────────┐
                              │ SMTP    │ │ Outbox   │
                              │ provider│ │ processor│
                              └─────────┘ └────┬────┘
                                               │
                                  ┌────────────┴───────────┐
                                  ▼                        ▼
                            Elasticsearch               Slack
```

### Scheduling and persistence

1.  The frontend submits the sender, recipients, message content, start
    time, and sending limits to the API.
2.  The API validates the request and stores the batch/email records in
    MySQL.
3.  The API creates delayed jobs in BullMQ. The queue is backed by
    Redis.
4.  A separate worker consumes due jobs and sends messages through the
    configured SMTP transport.
5.  Delivery outcomes are written back to MySQL. Relevant events are
    also placed in the outbox for downstream processing, such as
    Elasticsearch indexing and Slack notifications.

MySQL is the durable application record for batches and email statuses.
Redis/BullMQ stores the background jobs and rate-limit coordination
data. Keeping the worker separate from the API allows email delivery to
continue independently of frontend requests.

### Restart behaviour

BullMQ delayed jobs are stored in Redis, so restarting the API or worker
does not require the user to recreate future schedules, provided the
Redis data is retained. The application also has background
outbox/recovery processing for pending downstream work.

For the restart demonstration: - Schedule at least one email for a
future time. - Stop the API and worker processes. - Keep MySQL and Redis
running, and do not clear their data. - Restart the API and worker. -
Verify that the scheduled email is still present and is processed when
it becomes due.

A restart test should be performed against the actual environment used
for the demo.

### Rate limiting and concurrency

The worker applies sending controls before delivery: - **Minimum
delay:** enforces a minimum interval between sends for a sender. -
**Hourly limit:** caps the number of sends allowed for a sender during a
UTC-hour window. - **Concurrency:** the email worker is configured with
a concurrency of **5**.

Rate-limit coordination uses Redis-backed atomic operations so multiple
worker processes do not independently reserve the same sending slot.
When a sender reaches a limit, the email is deferred and retried at the
next eligible time.

The configured hourly window is a fixed UTC-hour window, not a rolling
60-minute window. An email deferred by the hourly limit may therefore
become eligible at the next UTC-hour boundary.

## Prerequisites

Install and configure the following before starting the application:

-   Node.js and npm.
-   MySQL.
-   Redis.
-   Elasticsearch, if using search/indexing features.
-   SMTP credentials. Ethereal Email can be used for
    development/testing.
-   Google OAuth credentials, if using Google sign-in.
-   Slack app credentials, if using Slack notifications.

The application has been developed on Windows as well as with local
service processes/containers. The commands below use a terminal such as
PowerShell.

## Project Structure

The repository is expected to use a monorepo layout similar to:

``` text
MailScheduler/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── modules/
│   │   ├── queue/
│   │   ├── workers/
│   │   └── server.ts
│   ├── knexfile.ts
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
├── .gitignore
└── README.md
```

Your actual folder names may differ. Update this tree if the submitted
repository uses a different structure.

## Configuration

Create local environment files from the example files supplied with the
project. Do not commit real credentials.

Typical configuration categories include:

  Category        Purpose
  --------------- -----------------------------------------------------
  MySQL           Host, port, database name, username, password
  Redis           Connection URL or host/port
  Session         Session secret and cookie settings
  Frontend/API    Frontend origin and backend API URL
  SMTP            SMTP host, port, username, password, sender address
  Google OAuth    Client ID, client secret, callback URL
  Slack OAuth     Client ID, client secret, callback URL
  Elasticsearch   Node URL and authentication, if enabled
  Bull Board      Admin access configuration

The backend uses `BULL_BOARD_ADMIN_EMAIL` for the Bull Board admin email
configuration. Refer to the checked-in `.env.example` files and the
configuration modules for the exact environment-variable names required
by this version of the application.

### Ethereal Email

[Ethereal Email](https://ethereal.email/) provides a test SMTP service.
It is useful for verifying that the application creates and sends
messages through Nodemailer without delivering them to a real
recipient's inbox.

1.  Create an Ethereal test account.
2.  Copy the generated SMTP host, port, username, and password into the
    backend's local environment file.
3.  Start the backend and worker.
4.  Schedule a test email.
5.  Open the Ethereal message preview to inspect the generated email.

Ethereal is a testing service, not a production email provider. For real
delivery, configure an SMTP provider and comply with its sending
policies.

## Installation and Running

> The backend script names below are taken from the backend package
> scripts. Check the frontend `package.json` and the repository's
> environment examples for the exact frontend command and required
> environment-variable names.

### 1. Start infrastructure services

Start MySQL and Redis. Start Elasticsearch as well if you want to use
email search/indexing.

Make sure the connection settings match the backend environment
configuration.

### 2. Configure the backend

``` powershell
cd backend
npm install
```

Create the backend environment file using the repository's example:

``` powershell
Copy-Item .env.example .env
```

Edit `.env` with your local MySQL, Redis, SMTP, OAuth, and other
required settings.

Run database migrations:

``` powershell
npm run migrate:latest
```

### 3. Start the API

In a backend terminal:

``` powershell
npm run dev
```

The backend development script runs `tsx watch src/server.ts`.

### 4. Start the email worker

Open a second terminal:

``` powershell
cd backend
npm run worker:dev
```

The worker must be running for due scheduled jobs to be processed. For a
non-watch worker process, the backend also defines:

``` powershell
npm run worker
```

### 5. Start the frontend

Open a third terminal:

``` powershell
cd frontend
npm install
npm run dev
```

If the frontend package uses a different development script, use the
script listed in `frontend/package.json`. Configure its API base URL to
point to the running backend.

### 6. Production build

Backend scripts include:

``` powershell
cd backend
npm run typecheck
npm run build
npm start
```

The `start` script runs the compiled `dist/server.js`. Start the
compiled worker separately using the production worker entry point
provided by the project; verify that the worker build output and script
are configured before deployment.

## Queue Monitoring

Bull Board is integrated to inspect the BullMQ email queue. Use the
configured Bull Board route and authorized admin access in your local
environment.

Queue states such as delayed, waiting, active, completed, and failed can
help diagnose job processing. The worker terminal logs are also
important: a queue dashboard indicator alone should not be treated as
proof that the worker is or is not processing jobs. Confirm processing
through worker logs and the resulting email status in MySQL.

## Implemented Feature Mapping

  -----------------------------------------------------------------------
  Requirement area                    Implementation
  ----------------------------------- -----------------------------------
  Backend scheduler                   Express API creates delayed BullMQ
                                      jobs

  Persistence                         MySQL stores batches, emails, and
                                      delivery state; Redis persists
                                      queue data

  Rate limiting                       Redis-backed minimum-delay and
                                      hourly-limit reservations

  Concurrency                         Separate BullMQ worker configured
                                      for concurrency 5

  Login                               Google OAuth integration

  Dashboard                           React dashboard with Scheduled,
                                      Sent, and Failed views

  Compose                             Sender selection, recipients,
                                      subject, body, start time, delay,
                                      and hourly limit

  Recipient import                    CSV/TXT recipient input

  Email delivery                      Nodemailer SMTP transport

  Search/indexing                     Elasticsearch integration

  Notifications                       Slack event notifications

  Queue inspection                    Bull Board
  -----------------------------------------------------------------------

## Testing Checklist

Before submission, verify each item in the environment you will
demonstrate:

-   [ ] User can sign in.
-   [ ] Sender can be configured and SMTP connection test succeeds.
-   [ ] A scheduled email is stored and appears in the Scheduled
    dashboard.
-   [ ] A due email is processed by the worker and appears in Sent.
-   [ ] Failed delivery is represented correctly in the
    dashboard/database.
-   [ ] CSV/TXT recipient import works with valid and invalid input.
-   [ ] Minimum delay is enforced between sends.
-   [ ] Hourly limit defers additional messages when the limit is
    reached.
-   [ ] Scheduled jobs survive an API/worker restart while Redis and
    MySQL data are retained.
-   [ ] Elasticsearch indexing/search works, if included in the
    submission demo.
-   [ ] Slack notifications work, if included in the submission demo.
-   [ ] No secrets or local `.env` files are committed.

## Demo Video (Maximum 5 Minutes)

Suggested recording plan:

  -----------------------------------------------------------------------
  Time                                Demonstration
  ----------------------------------- -----------------------------------
  0:00--0:20                          Introduce MailScheduler and show
                                      the dashboard

  0:20--1:20                          Compose and schedule a few emails

  1:20--2:00                          Show Scheduled and Sent dashboard
                                      views

  2:00--3:15                          Stop and restart the API/worker,
                                      then show that the future schedule
                                      remains and is sent when due

  3:15--4:15                          Demonstrate minimum delay or hourly
                                      rate limiting

  4:15--5:00                          Briefly explain MySQL,
                                      Redis/BullMQ, worker, and SMTP
                                      architecture
  -----------------------------------------------------------------------

Keep the video within the five-minute limit and make sure credentials,
tokens, and private recipient data are not visible.

## Assumptions, Trade-offs, and Limitations

-   **Ethereal is for testing:** it previews test messages and does not
    provide normal production inbox delivery.
-   **MySQL is the application record:** queue state and email delivery
    state serve different purposes; use MySQL to verify the final
    application status.
-   **Redis data must be retained:** clearing Redis or running it
    without persistence can remove delayed queue jobs. Production Redis
    should be configured with appropriate persistence and backups.
-   **Fixed UTC-hour quota:** the hourly limit is evaluated in fixed
    UTC-hour windows, rather than a rolling 60-minute interval.
-   **Worker concurrency:** concurrency is configured separately from
    the sender's rate limits. Higher concurrency does not bypass the
    rate limiter.
-   **SMTP delivery cannot be guaranteed exactly once:** if an SMTP
    server accepts a message but the worker crashes before recording
    success in MySQL, a retry can potentially send the same message
    again. This is an inherent ambiguity when coordinating an external
    SMTP side effect with database state.
-   **External services are required:** Google OAuth, Slack, SMTP,
    Redis, MySQL, and Elasticsearch features depend on valid credentials
    and running services.
-   **Production hardening:** configure secure secrets, HTTPS, cookie
    settings, access controls, backups, monitoring, and
    provider-specific sending limits before production use.

## Troubleshooting

### Scheduled emails are not being sent

-   Confirm that MySQL and Redis are reachable.
-   Confirm that the API is running.
-   Start the separate email worker (`npm run worker:dev` during
    development).
-   Check worker logs for SMTP errors, rate-limit deferrals, or database
    errors.
-   Confirm the job is due and the email is in an eligible status.

### Email is deferred by rate limiting

Check the sender's configured minimum delay and hourly limit. An
hourly-limited message may wait until the next UTC-hour window.

### SMTP test fails

Verify the SMTP host, port, username, password, TLS/security settings,
and provider restrictions. For Gmail, use an app password where required
rather than the normal account password.

### Dashboard counts do not match

Check the `/emails/stats` API response and its database query, then
compare it with the email records in MySQL. Refresh the dashboard after
a send or cancellation.

## Submission

-   GitHub repository: create it as **Private**.
-   Add the required reviewers/collaborators by their exact GitHub
    usernames.
-   Include this `README.md`, source code, and safe example environment
    files.
-   Do not commit `.env`, OAuth secrets, SMTP passwords, session
    secrets, API tokens, or database passwords.
-   Add the demo video (or a link to it, if the submission instructions
    permit).
-   Submit the repository and demo details using the assignment's
    ClickUp form:\
    https://forms.clickup.com/9005062261/f/8cbwp3n-8876/6NNNJ92DV93PQTAYST

------------------------------------------------------------------------

**Maintainer note:** Before submitting, compare this README with the
final repository. Confirm the actual frontend scripts, API URL,
environment-variable names, Bull Board route, and production worker
command, and remove any feature from the feature list that is not
present in the submitted branch.
