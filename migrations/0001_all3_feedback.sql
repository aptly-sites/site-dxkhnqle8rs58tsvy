CREATE TABLE IF NOT EXISTS all3_feedback (
  project TEXT NOT NULL CHECK(project='3971c004018e4052a04312c7bc77c844'),
  request_id TEXT NOT NULL,
  message TEXT NOT NULL CHECK(length(message) BETWEEN 5 AND 3000),
  submitted_at INTEGER NOT NULL,
  visitor_hash TEXT NOT NULL,
  notification_status TEXT NOT NULL DEFAULT 'pending',
  PRIMARY KEY(project, request_id)
);
CREATE INDEX IF NOT EXISTS all3_recent ON all3_feedback(submitted_at,visitor_hash);

CREATE TABLE IF NOT EXISTS all3_feedback_config (
  setting TEXT PRIMARY KEY, value TEXT NOT NULL
);
INSERT OR IGNORE INTO all3_feedback_config VALUES ('rate_key', lower(hex(randomblob(32))));
