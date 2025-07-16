CREATE TYPE history_input_type AS ENUM ('form', 'freeform');

CREATE TABLE history (
    id           UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID                NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name         VARCHAR(256)        NOT NULL,
    created_at   TIMESTAMPTZ         NOT NULL DEFAULT now(),
    input_type   history_input_type  NOT NULL,
    input        JSONB               NOT NULL,
    output       JSONB               NOT NULL
);

-- index on created_at for time-based queries
CREATE INDEX ON history (created_at DESC);

-- GIN index so you can query inside input/output if needed
CREATE INDEX ON history USING GIN (input);
CREATE INDEX ON history USING GIN (output);