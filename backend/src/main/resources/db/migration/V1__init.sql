CREATE TABLE users (
    id             UUID PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    full_name      VARCHAR(150) NOT NULL,
    role           VARCHAR(30) NOT NULL DEFAULT 'USER',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE prospects (
    id                 UUID PRIMARY KEY,
    owner_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    company_name       VARCHAR(200) NOT NULL,
    contact_name       VARCHAR(150),
    email              VARCHAR(255),
    website            VARCHAR(255),
    industry           VARCHAR(120),
    company_description TEXT NOT NULL,
    source             VARCHAR(20) NOT NULL DEFAULT 'MANUAL'
                       CHECK (source IN ('MANUAL', 'FORM', 'DEMO')),
    status             VARCHAR(20) NOT NULL DEFAULT 'NEW'
                       CHECK (status IN ('NEW', 'ANALYZING', 'QUALIFIED', 'NOT_QUALIFIED', 'ERROR')),
    deleted_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT prospects_email_format CHECK (email IS NULL OR email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

CREATE TABLE qualification_analyses (
    id                  UUID PRIMARY KEY,
    prospect_id         UUID NOT NULL REFERENCES prospects(id) ON DELETE RESTRICT,
    correlation_id      UUID UNIQUE,
    score               INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    category            VARCHAR(10) NOT NULL CHECK (category IN ('HIGH', 'MEDIUM', 'LOW')),
    confidence          VARCHAR(10) CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
    summary             TEXT NOT NULL,
    strengths           JSONB NOT NULL DEFAULT '[]'::jsonb,
    weaknesses          JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_information JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations     JSONB NOT NULL DEFAULT '[]'::jsonb,
    model_name          VARCHAR(120),
    prompt_version      VARCHAR(40),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE email_drafts (
    id             UUID PRIMARY KEY,
    prospect_id    UUID NOT NULL REFERENCES prospects(id) ON DELETE RESTRICT,
    correlation_id UUID UNIQUE,
    subject        VARCHAR(300) NOT NULL,
    body           TEXT NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW'
                   CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SENT', 'FAILED')),
    approved_at    TIMESTAMPTZ,
    approved_by    UUID REFERENCES users(id) ON DELETE RESTRICT,
    sent_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_events (
    id          UUID PRIMARY KEY,
    prospect_id UUID REFERENCES prospects(id) ON DELETE RESTRICT,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type  VARCHAR(60) NOT NULL,
    description VARCHAR(500) NOT NULL,
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE automation_runs (
    id              UUID PRIMARY KEY,
    correlation_id  UUID NOT NULL UNIQUE,
    automation_type VARCHAR(40) NOT NULL,
    prospect_id     UUID REFERENCES prospects(id) ON DELETE RESTRICT,
    draft_id        UUID REFERENCES email_drafts(id) ON DELETE RESTRICT,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX idx_prospects_owner_status ON prospects(owner_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_prospects_company ON prospects(lower(company_name));
CREATE INDEX idx_analyses_prospect_date ON qualification_analyses(prospect_id, created_at DESC);
CREATE INDEX idx_drafts_status_date ON email_drafts(status, created_at DESC);
CREATE INDEX idx_drafts_prospect_date ON email_drafts(prospect_id, created_at DESC);
CREATE INDEX idx_events_date ON activity_events(created_at DESC);
CREATE INDEX idx_events_prospect ON activity_events(prospect_id, created_at DESC);
CREATE INDEX idx_runs_date ON automation_runs(created_at DESC);
