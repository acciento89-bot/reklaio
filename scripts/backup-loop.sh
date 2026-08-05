#!/bin/sh
set -u

BACKUP_DIR="${BACKUP_DIR:-/backups}"
UPLOAD_DIR="${UPLOAD_DIR:-/uploads}"
INTERVAL="${BACKUP_INTERVAL_SECONDS:-86400}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
POLL_SECONDS="${BACKUP_POLL_SECONDS:-300}"

mkdir -p "$BACKUP_DIR"
echo "Reklaio backup service started"

while true; do
  psql "$DATABASE_URL" -c "UPDATE ai_usage_events SET status='failed',error_code='STALE_RESERVATION',completed_at=NOW() WHERE status='reserved' AND created_at<NOW()-INTERVAL '30 minutes'; DELETE FROM rate_limit_buckets WHERE updated_at<NOW()-INTERVAL '2 days';" >/dev/null 2>&1 || true

  request_id="$(psql "$DATABASE_URL" -Atqc "SELECT id FROM backup_requests WHERE status='pending' ORDER BY created_at ASC LIMIT 1" 2>/dev/null || true)"
  last_epoch="$(psql "$DATABASE_URL" -Atqc "SELECT COALESCE(EXTRACT(EPOCH FROM MAX(completed_at))::bigint,0) FROM backup_runs WHERE status='completed'" 2>/dev/null || echo 0)"
  now_epoch="$(date +%s)"
  due=0

  if [ -n "$request_id" ]; then
    due=1
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "UPDATE backup_requests SET status='running',started_at=NOW() WHERE id='$request_id' AND status='pending'" >/dev/null 2>&1 || request_id=""
  elif [ $((now_epoch - last_epoch)) -ge "$INTERVAL" ]; then
    due=1
  fi

  if [ "$due" -eq 1 ]; then
    stamp="$(date -u +%Y%m%dT%H%M%SZ)"
    db_file="$BACKUP_DIR/reklaio-db-$stamp.dump"
    uploads_file="$BACKUP_DIR/reklaio-uploads-$stamp.tar.gz"
    started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    error=""

    echo "Starting Reklaio backup $stamp"
    pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges --file="$db_file" || error="PostgreSQL backup failed"

    if [ -z "$error" ]; then
      mkdir -p "$UPLOAD_DIR"
      tar -C "$UPLOAD_DIR" -czf "$uploads_file" . || error="Upload backup failed"
    fi

    if [ -z "$error" ]; then
      db_bytes="$(stat -c %s "$db_file" 2>/dev/null || echo 0)"
      upload_bytes="$(stat -c %s "$uploads_file" 2>/dev/null || echo 0)"
      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO backup_runs(request_id,database_file,uploads_file,database_bytes,uploads_bytes,status,started_at) VALUES($(if [ -n "$request_id" ]; then printf "'%s'" "$request_id"; else printf "NULL"; fi),'$(basename "$db_file")','$(basename "$uploads_file")',$db_bytes,$upload_bytes,'completed','$started_at');" >/dev/null 2>&1
      if [ -n "$request_id" ]; then psql "$DATABASE_URL" -c "UPDATE backup_requests SET status='completed',completed_at=NOW() WHERE id='$request_id'" >/dev/null 2>&1 || true; fi
      echo "Backup completed: $(basename "$db_file"), $(basename "$uploads_file")"
    else
      rm -f "$db_file" "$uploads_file"
      safe_error="$(printf "%s" "$error" | sed "s/'/''/g")"
      psql "$DATABASE_URL" -c "INSERT INTO backup_runs(request_id,status,error_message,started_at) VALUES($(if [ -n "$request_id" ]; then printf "'%s'" "$request_id"; else printf "NULL"; fi),'failed','$safe_error','$started_at');" >/dev/null 2>&1 || true
      if [ -n "$request_id" ]; then psql "$DATABASE_URL" -c "UPDATE backup_requests SET status='failed',completed_at=NOW(),error_message='$safe_error' WHERE id='$request_id'" >/dev/null 2>&1 || true; fi
      echo "Backup failed: $error" >&2
    fi

    find "$BACKUP_DIR" -type f -mtime "+$RETENTION_DAYS" -delete 2>/dev/null || true
  fi

  sleep "$POLL_SECONDS"
done
