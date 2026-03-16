import sql from '@forge/sql';

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;

  await sql.executeDDL(`CREATE TABLE IF NOT EXISTS webhook_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    source VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    release_name VARCHAR(255),
    namespace VARCHAR(255),
    env VARCHAR(100),
    issue_keys TEXT,
    deployment_state VARCHAR(20),
    accepted INTEGER,
    rejected INTEGER,
    unknown_keys INTEGER,
    error TEXT
  )`);

  await sql.executeDDL(
    `CREATE INDEX IF NOT EXISTS idx_we_timestamp ON webhook_events (timestamp)`
  );

  await sql.executeDDL(
    `CREATE INDEX IF NOT EXISTS idx_we_source_timestamp ON webhook_events (source, timestamp)`
  );

  schemaReady = true;
}

export async function logEvent({
  source,
  statusCode,
  releaseName,
  namespace,
  env,
  issueKeys,
  deploymentState,
  accepted,
  rejected,
  unknownKeys,
  error,
} = {}) {
  try {
    await ensureSchema();

    const truncatedError = error ? String(error).slice(0, 1000) : null;
    const issueKeysStr = Array.isArray(issueKeys)
      ? issueKeys.join(',')
      : (issueKeys ?? null);
    const timestamp = new Date().toISOString();

    await sql
      .prepare(
        `INSERT INTO webhook_events (timestamp, source, status_code, release_name, namespace, env, issue_keys, deployment_state, accepted, rejected, unknown_keys, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bindParams(
        timestamp,
        source,
        statusCode,
        releaseName ?? null,
        namespace ?? null,
        env ?? null,
        issueKeysStr,
        deploymentState ?? null,
        accepted ?? null,
        rejected ?? null,
        unknownKeys ?? null,
        truncatedError
      )
      .execute();
  } catch (e) {
    console.error('Failed to log event:', e);
  }
}

export async function getEvents({ source, beforeTimestamp, beforeId } = {}) {
  await ensureSchema();

  const conditions = [];
  const params = [];

  if (source) {
    conditions.push('source = ?');
    params.push(source);
  }

  if (beforeTimestamp && beforeId) {
    conditions.push('(timestamp < ? OR (timestamp = ? AND id < ?))');
    params.push(beforeTimestamp, beforeTimestamp, beforeId);
  }

  let query = 'SELECT * FROM webhook_events';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY timestamp DESC, id DESC LIMIT 26';

  const result = await sql.prepare(query).bindParams(...params).execute();
  const rows = result.rows;
  const hasMore = rows.length > 25;

  return { events: rows.slice(0, 25), hasMore };
}

export async function getStats({ source } = {}) {
  await ensureSchema();

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const params = [cutoff];

  let query = `SELECT
    SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as accepted,
    SUM(CASE WHEN status_code IN (400, 401, 502, 503) THEN 1 ELSE 0 END) as failed,
    SUM(CASE WHEN status_code = 204 THEN 1 ELSE 0 END) as skipped
  FROM webhook_events
  WHERE timestamp > ?`;

  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }

  const result = await sql.prepare(query).bindParams(...params).execute();
  const row = result.rows[0] || {};

  return {
    accepted: row.accepted ?? 0,
    failed: row.failed ?? 0,
    skipped: row.skipped ?? 0,
  };
}

export async function cleanupOldEvents() {
  try {
    await ensureSchema();

    const cutoff = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const result = await sql
      .prepare('DELETE FROM webhook_events WHERE timestamp < ?')
      .bindParams(cutoff)
      .execute();

    const deleted = result.rows?.affectedRows ?? 0;
    console.log(
      `Event log cleanup: deleted ${deleted} rows older than 30 days`
    );
    return deleted;
  } catch (e) {
    console.error('Failed to cleanup old events:', e);
    return 0;
  }
}

export const cleanupHandler = async () => {
  await cleanupOldEvents();
};
