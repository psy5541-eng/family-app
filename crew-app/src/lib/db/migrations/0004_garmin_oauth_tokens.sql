-- 가민 OAuth 토큰 캐싱 + 연동 상태 관리
ALTER TABLE garmin_accounts ADD COLUMN encrypted_oauth1 TEXT;
ALTER TABLE garmin_accounts ADD COLUMN encrypted_oauth2 TEXT;
ALTER TABLE garmin_accounts ADD COLUMN oauth2_expires_at INTEGER;
ALTER TABLE garmin_accounts ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
