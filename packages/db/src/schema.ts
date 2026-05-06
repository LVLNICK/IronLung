export const initialMigration = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  unit_preference TEXT NOT NULL CHECK (unit_preference IN ('lbs', 'kg')),
  theme TEXT NOT NULL CHECK (theme IN ('dark', 'light', 'system')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT NOT NULL DEFAULT '[]',
  equipment TEXT NOT NULL,
  movement_pattern TEXT NOT NULL,
  is_unilateral INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_template (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_template_exercise (
  id TEXT PRIMARY KEY,
  workout_template_id TEXT NOT NULL REFERENCES workout_template(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercise(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL,
  target_sets INTEGER NOT NULL,
  target_reps TEXT NOT NULL,
  target_rest_seconds INTEGER NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS workout_session (
  id TEXT PRIMARY KEY,
  workout_template_id TEXT REFERENCES workout_template(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  notes TEXT,
  bodyweight REAL,
  import_source TEXT,
  imported_metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_session_exercise (
  id TEXT PRIMARY KEY,
  workout_session_id TEXT NOT NULL REFERENCES workout_session(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercise(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL,
  notes TEXT,
  import_source TEXT,
  imported_metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS set_log (
  id TEXT PRIMARY KEY,
  workout_session_exercise_id TEXT NOT NULL REFERENCES workout_session_exercise(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight REAL NOT NULL,
  reps INTEGER NOT NULL,
  rpe REAL,
  set_type TEXT NOT NULL CHECK (set_type IN ('warmup', 'working', 'drop', 'failure', 'amrap')),
  is_completed INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  import_source TEXT,
  import_hash TEXT,
  imported_metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS personal_record (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL REFERENCES exercise(id) ON DELETE CASCADE,
  workout_session_id TEXT NOT NULL REFERENCES workout_session(id) ON DELETE CASCADE,
  set_log_id TEXT REFERENCES set_log(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('max_weight', 'estimated_1rm', 'exercise_session_volume', 'reps_at_weight', 'workout_session_volume')),
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  achieved_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS progress_photo (
  id TEXT PRIMARY KEY,
  image_path TEXT NOT NULL,
  pose_type TEXT NOT NULL CHECK (pose_type IN ('front', 'side', 'back', 'other')),
  age REAL,
  height REAL,
  bodyweight REAL,
  lighting_tag TEXT,
  pump_tag TEXT,
  notes TEXT,
  captured_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS body_analysis (
  id TEXT PRIMARY KEY,
  progress_photo_id TEXT NOT NULL REFERENCES progress_photo(id) ON DELETE CASCADE,
  score REAL NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  model_version TEXT NOT NULL,
  measurements_json TEXT NOT NULL,
  warnings_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exercise_name ON exercise(name);
CREATE INDEX IF NOT EXISTS idx_set_log_session_exercise ON set_log(workout_session_exercise_id);
CREATE INDEX IF NOT EXISTS idx_pr_exercise_type ON personal_record(exercise_id, type);
CREATE INDEX IF NOT EXISTS idx_progress_photo_captured_at ON progress_photo(captured_at);
`;

export const tableNames = [
  "user_settings",
  "exercise",
  "workout_template",
  "workout_template_exercise",
  "workout_session",
  "workout_session_exercise",
  "set_log",
  "personal_record",
  "progress_photo",
  "body_analysis"
] as const;

export type TableName = (typeof tableNames)[number];
