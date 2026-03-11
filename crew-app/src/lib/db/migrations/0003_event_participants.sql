-- 일정 참석자 테이블
CREATE TABLE IF NOT EXISTS event_participants (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'joined',
  created_at INTEGER NOT NULL
);

-- 인덱스: 일정별 참석자 조회
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
-- 인덱스: 사용자별 참석 일정 조회
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id);
-- 유니크: 한 일정에 같은 사용자 중복 참석 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_participants_unique ON event_participants(event_id, user_id);
