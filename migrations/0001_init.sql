CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  server_timestamp TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  accept_language TEXT,
  referer TEXT,
  client_json TEXT
);
