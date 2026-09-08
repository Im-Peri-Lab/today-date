/**
 * PostgREST(Supabase REST) HTTP 스텁 — e2e 에서 실제 라우트 코드를 실행시키기 위한 대역.
 *
 * 왜 필요한가: 기존 e2e 는 page.route() 로 /api/* 응답을 브라우저에서 가로챘다. 그래서
 * 라우트 핸들러·미들웨어·데이터 계층에 요청이 아예 도달하지 않았고, 커플 격리처럼
 * "서버가 무엇을 걸렀는가"가 핵심인 동작은 e2e 로 검증할 수 없었다. 이 스텁을 세우고
 * SUPABASE_URL 을 여기로 돌리면, 브라우저 → Next 서버 → 실제 라우트 → supabase-js →
 * 이 스텁까지 전 구간이 실제 HTTP 로 흐른다.
 *
 * 왜 .mjs 인가: 이 파일은 Playwright 가 아니라 node 가 직접 실행하는 별도 프로세스다
 * (playwright.config.ts 의 webServer). tsx/ts-node 를 devDependency 로 들이지 않기 위해
 * 트랜스파일이 필요 없는 평문 ESM 으로 둔다. 시드 데이터는 스펙(.ts)과 공유해야 하므로
 * 두 언어에서 모두 읽히는 seed.json 에 두었다.
 *
 * 구현 범위는 이 리포의 앱 코드가 실제로 쓰는 PostgREST 기능으로 한정한다. 와이어 규약은
 * node_modules/@supabase/postgrest-js 의 직렬화 코드를 읽고 맞췄다:
 *   - 필터: `col=eq.v` / `in.(a,b)` / `is.null` / `gt.v` / `ilike.%v%` / `cs.{a,b}`
 *   - `or=(a.ilike.%x%,b.ilike.%x%)`
 *   - `order=col.asc|desc[.nullsfirst|.nullslast]` (쉼표로 다중), `limit=N`
 *   - `.single()` → `Accept: application/vnd.pgrst.object+json` → 1행이 아니면 406 PGRST116
 *   - `.maybeSingle()` → Accept 를 바꾸지 않는다. 클라이언트가 배열을 스스로 줄인다
 *   - `.select('*', { count: 'exact', head: true })` → HEAD + `Prefer: count=exact`,
 *     개수는 응답의 `content-range: 0-{n-1}/{total}` 헤더로 전달된다
 */

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const SEED = JSON.parse(readFileSync(join(HERE, 'seed.json'), 'utf8'))
const PORT = Number(process.env.STUB_PORT ?? 3200)

/**
 * 컬럼 DEFAULT 대역(§ supabase/migrations/001_init.sql).
 * 재현하지 않으면 status 없이 INSERT 된 행이 목록(status=eq.wishlist)에 안 잡혀
 * "생성했는데 안 보인다"는 실제와 다른 실패가 난다.
 */
const COLUMN_DEFAULTS = {
  activities: {
    status: 'wishlist', time_of_day: 'any', image_urls: [], location: null, memo: null,
    reference_url: null, visited_at: null, visited_end_at: null, rating: null, review_note: null,
  },
  places: {
    status: 'wishlist', meal_times: [], image_urls: [], location: null, memo: null,
    reference_url: null, visited_at: null, rating: null, review_note: null,
  },
  recommendations_log: { recommended_ids: [], selected_id: null },
  couples: { failed_attempts: 0, session_version: 1, passcode_hash: null, locked_until: null },
  users: { email_verified: false },
  // 015 로 email_tokens 에 couple_id 가 추가됐다(invite_partner 전용 스코프, nullable).
  // 기본값을 재현하지 않으면 초대 이외 목적으로 만든 토큰 행에 couple_id 키가 아예 없어
  // `couple_id=is.null` 필터가 빗나간다(undefined ≠ null).
  email_tokens: { used_at: null, couple_id: null },
}

/**
 * NOT NULL 제약 대역.
 *
 * 014 마이그레이션이 domain 3종의 couple_id 를 NOT NULL 로 올렸으므로 스텁도 같이 올린다.
 * 이렇게 두면 "INSERT 에서 couple_id 를 빠뜨리는" 회귀가 e2e 에서 실제 DB 와 같은 방식으로
 * (23502 오류로) 드러난다 — 스텁이 실제 스키마보다 관대하면 e2e 가 통과해도 프로덕션에서
 * 깨지는 구멍이 남는다.
 */
const NOT_NULL = {
  activities: ['couple_id', 'title'],
  places: ['couple_id', 'title', 'area'],
  recommendations_log: ['couple_id', 'track'],
  users: ['couple_id', 'email'],
  email_tokens: ['token_hash', 'purpose', 'target_email', 'expires_at'],
}

/** PostgREST 임베드(`category:activity_categories(...)`) 해석용 외래키 맵. */
const EMBEDS = {
  activities: { activity_categories: { localKey: 'category_id', foreignKey: 'id' } },
  places: { place_categories: { localKey: 'category_id', foreignKey: 'id' } },
}

/** `?select=`/`?order=` 등 필터가 아닌 예약 파라미터. */
const RESERVED_PARAMS = new Set(['select', 'order', 'limit', 'offset', 'or', 'and', 'on_conflict', 'columns'])

let tables = {}
let scenario = null

function reset(name) {
  const data = SEED.scenarios[name]
  if (!data) throw new Error(`알 수 없는 시나리오: ${name}`)
  tables = JSON.parse(JSON.stringify(data))
  scenario = name
}

const rowsOf = (table) => (tables[table] ??= [])

// ──────────────────────────────────────────────
// 필터
// ──────────────────────────────────────────────

/** PostgREST 의 LIKE 패턴(%, _)을 정규식으로. */
function likeToRegExp(pattern, flags) {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.')
  return new RegExp(`^${escaped}$`, flags)
}

/** `in.(a,b,"c,d")` 의 값 목록 파싱 — 따옴표로 감싼 값 안의 쉼표를 보존한다. */
function parseInList(raw) {
  const inner = raw.replace(/^\(/, '').replace(/\)$/, '')
  const out = []
  let cur = ''
  let quoted = false
  for (const ch of inner) {
    if (ch === '"') { quoted = !quoted; continue }
    if (ch === ',' && !quoted) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur !== '') out.push(cur)
  return out
}

function coerce(raw) {
  if (raw === 'null') return null
  if (raw === 'true') return true
  if (raw === 'false') return false
  return raw
}

/** `eq.<value>` 형태의 단일 조건을 평가한다. */
function matchOp(value, op, raw) {
  switch (op) {
    case 'eq': return String(value) === raw
    case 'neq': return String(value) !== raw
    case 'gt': return value != null && String(value) > raw
    case 'gte': return value != null && String(value) >= raw
    case 'lt': return value != null && String(value) < raw
    case 'lte': return value != null && String(value) <= raw
    case 'is': return value === coerce(raw)
    case 'like': return typeof value === 'string' && likeToRegExp(raw, '').test(value)
    case 'ilike': return typeof value === 'string' && likeToRegExp(raw, 'i').test(value)
    case 'in': return parseInList(raw).includes(String(value))
    case 'cs': {
      // 배열 포함: `cs.{lunch,dinner}`
      const wanted = raw.replace(/^\{/, '').replace(/\}$/, '').split(',').filter(Boolean)
      return Array.isArray(value) && wanted.every((w) => value.includes(w))
    }
    default:
      throw new Error(`스텁 미지원 연산자: ${op}`)
  }
}

/** `title.ilike.%x%` 처럼 컬럼까지 포함한 조건 문자열을 평가한다(or 절 내부용). */
function matchClause(row, clause) {
  const firstDot = clause.indexOf('.')
  const secondDot = clause.indexOf('.', firstDot + 1)
  if (firstDot < 0 || secondDot < 0) throw new Error(`스텁: or 절 파싱 실패 — ${clause}`)
  const column = clause.slice(0, firstDot)
  const op = clause.slice(firstDot + 1, secondDot)
  const raw = clause.slice(secondDot + 1)
  return matchOp(row[column], op, raw)
}

/**
 * `or=(title.ilike.%x%,memo.ilike.%x%)` 의 절 분리.
 *
 * 최상위 쉼표로만 나눈다. 앱은 검색어에서 쉼표를 제거하고 넘기므로
 * (`q.replace(/[%,]/g, ' ')` — src/app/api/activities/route.ts) 절 안에 쉼표가
 * 섞여 들어오는 경우는 없지만, 중첩 괄호는 방어적으로 세어 둔다.
 */
function splitOrClauses(expr) {
  const inner = expr.replace(/^\(/, '').replace(/\)$/, '')
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of inner) {
    if (ch === '(') depth += 1
    if (ch === ')') depth -= 1
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur !== '') out.push(cur)
  return out
}

function applyFilters(rows, params) {
  let out = rows
  for (const [key, raw] of params.entries()) {
    if (RESERVED_PARAMS.has(key)) continue
    const dot = raw.indexOf('.')
    if (dot < 0) throw new Error(`스텁: 필터 파싱 실패 — ${key}=${raw}`)
    const op = raw.slice(0, dot)
    const value = raw.slice(dot + 1)
    out = out.filter((row) => matchOp(row[key], op, value))
  }
  const orExpr = params.get('or')
  if (orExpr) {
    const clauses = splitOrClauses(orExpr)
    out = out.filter((row) => clauses.some((c) => matchClause(row, c)))
  }
  return out
}

function applyOrder(rows, params) {
  const spec = params.get('order')
  if (!spec) return rows
  const terms = spec.split(',').map((t) => {
    const [column, ...mods] = t.split('.')
    return {
      column,
      ascending: !mods.includes('desc'),
      // PostgREST 기본은 NULLS LAST(asc)/NULLS FIRST(desc). 앱은 nullsFirst 를 명시하므로 그것만 본다.
      nullsFirst: mods.includes('nullsfirst'),
    }
  })
  const out = [...rows]
  // 다중 정렬은 뒤 항목부터 안정 정렬을 쌓아 앞 항목이 우선하도록 만든다.
  for (const term of [...terms].reverse()) {
    out.sort((a, b) => {
      const av = a[term.column]
      const bv = b[term.column]
      const aNull = av === null || av === undefined
      const bNull = bv === null || bv === undefined
      if (aNull && bNull) return 0
      if (aNull) return term.nullsFirst ? -1 : 1
      if (bNull) return term.nullsFirst ? 1 : -1
      if (av === bv) return 0
      return (av < bv ? -1 : 1) * (term.ascending ? 1 : -1)
    })
  }
  return out
}

// ──────────────────────────────────────────────
// select 투영 + 임베드
// ──────────────────────────────────────────────

/** 최상위 쉼표로 select 항목을 나눈다(괄호 안 쉼표는 보존). */
function splitSelect(spec) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of spec) {
    if (ch === '(') depth += 1
    if (ch === ')') depth -= 1
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue }
    cur += ch
  }
  if (cur.trim() !== '') out.push(cur.trim())
  return out
}

function project(table, rows, selectSpec) {
  if (!selectSpec) return rows.map((r) => ({ ...r }))
  const parts = splitSelect(selectSpec)
  return rows.map((row) => {
    const out = {}
    for (const part of parts) {
      if (part === '*') {
        Object.assign(out, row)
        continue
      }
      // `alias:foreign_table(cols)` 임베드
      const embed = part.match(/^(?:([\w]+):)?([\w]+)\(([^)]*)\)$/)
      if (embed) {
        const [, alias, foreignTable, cols] = embed
        const rel = EMBEDS[table]?.[foreignTable]
        if (!rel) throw new Error(`스텁: 미등록 임베드 ${table} → ${foreignTable}`)
        const parent = rowsOf(foreignTable).find((f) => f[rel.foreignKey] === row[rel.localKey])
        out[alias ?? foreignTable] = parent
          ? project(foreignTable, [parent], cols)[0]
          : null
        continue
      }
      // 단순 컬럼(공백 포함 가능: 'recommended_ids, created_at')
      out[part] = row[part] ?? null
    }
    return out
  })
}

// ──────────────────────────────────────────────
// 응답
// ──────────────────────────────────────────────

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = body === undefined ? '' : JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', ...extraHeaders })
  res.end(payload)
}

/** PostgREST 오류 형태 — supabase-js 가 error 객체로 그대로 전달한다. */
function sendError(res, status, code, message, details = null) {
  sendJson(res, status, { code, message, details, hint: null })
}

const wantsObject = (req) => (req.headers.accept ?? '').includes('application/vnd.pgrst.object+json')
const wantsCount = (req) => /count=(exact|planned|estimated)/.test(req.headers.prefer ?? '')
const wantsRepresentation = (req) => (req.headers.prefer ?? '').includes('return=representation')

/**
 * 결과 집합을 응답으로 내보낸다.
 * `.single()` 은 1행이 아니면 406 PGRST116 — 이 규약을 맞추지 않으면
 * "행 없음"이 오류가 아니라 성공으로 흘러 라우트의 404 처리가 재현되지 않는다.
 */
function sendRows(req, res, rows, total, { head = false } = {}) {
  const headers = {}
  if (wantsCount(req)) {
    const upper = Math.max(total - 1, 0)
    headers['content-range'] = total === 0 ? `*/0` : `0-${upper}/${total}`
  }
  if (head) {
    res.writeHead(200, { 'Content-Type': 'application/json', ...headers })
    return res.end()
  }
  if (wantsObject(req)) {
    if (rows.length !== 1) {
      return sendError(
        res, 406, 'PGRST116',
        'JSON object requested, multiple (or no) rows returned',
        `Results contain ${rows.length} rows, application/vnd.pgrst.object+json requires 1 row`
      )
    }
    return sendJson(res, 200, rows[0], headers)
  }
  sendJson(res, 200, rows, headers)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => { raw += chunk })
    req.on('end', () => {
      if (raw === '') return resolve(null)
      try { resolve(JSON.parse(raw)) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

/** NOT NULL 위반 시 실제 Postgres 와 같은 코드(23502)로 400 을 낸다. */
function findNotNullViolation(table, row) {
  for (const column of NOT_NULL[table] ?? []) {
    if (row[column] === null || row[column] === undefined) return column
  }
  return null
}

// ──────────────────────────────────────────────
// 라우팅
// ──────────────────────────────────────────────

async function handleControl(req, res, url) {
  const path = url.pathname.replace('/__control', '')

  if (path === '/health') {
    return sendJson(res, 200, { ok: true, scenario })
  }

  if (path === '/reset' && req.method === 'POST') {
    const body = await readBody(req)
    reset(body?.scenario ?? 'twoCouples')
    return sendJson(res, 200, { ok: true, scenario })
  }

  // 스펙이 "실제로 안 바뀌었는지" 확인할 때 쓰는 원본 덤프.
  if (path === '/rows' && req.method === 'GET') {
    const table = url.searchParams.get('table')
    if (!table) return sendError(res, 400, 'STUB', 'table 쿼리 파라미터가 필요합니다.')
    return sendJson(res, 200, rowsOf(table))
  }

  // 앱이 만들 수 없는 행을 심을 때 쓴다(예: 원문을 알고 있는 이메일 토큰).
  if (path === '/rows' && req.method === 'POST') {
    const body = await readBody(req)
    if (!body?.table || !body?.row) return sendError(res, 400, 'STUB', 'table 과 row 가 필요합니다.')
    // 컬럼 DEFAULT 를 REST INSERT 와 동일하게 적용한다 — 심는 행이 명시하지 않은 컬럼이
    // 아예 없는 키로 남으면 `col=is.null` 필터가 빗나간다(undefined ≠ null).
    rowsOf(body.table).push({
      id: randomUUID(),
      created_at: new Date().toISOString(),
      ...COLUMN_DEFAULTS[body.table],
      ...body.row,
    })
    return sendJson(res, 200, { ok: true })
  }

  return sendError(res, 404, 'STUB', `알 수 없는 control 경로: ${path}`)
}

async function handleRest(req, res, url) {
  const table = url.pathname.replace('/rest/v1/', '').split('/')[0]
  if (!table) return sendError(res, 404, 'STUB', '테이블이 지정되지 않았습니다.')

  const params = url.searchParams
  const selectSpec = params.get('select')
  const limit = params.get('limit') ? Number(params.get('limit')) : null

  if (req.method === 'GET' || req.method === 'HEAD') {
    const filtered = applyFilters(rowsOf(table), params)
    const ordered = applyOrder(filtered, params)
    const limited = limit === null ? ordered : ordered.slice(0, limit)
    // count 는 limit 적용 전 총 개수다(PostgREST 의 content-range 총계와 동일).
    return sendRows(req, res, project(table, limited, selectSpec), filtered.length, {
      head: req.method === 'HEAD',
    })
  }

  if (req.method === 'POST') {
    const body = await readBody(req)
    const incoming = Array.isArray(body) ? body : [body]
    const inserted = []
    for (const payload of incoming) {
      const now = new Date().toISOString()
      const row = {
        id: randomUUID(),
        created_at: now,
        updated_at: now,
        ...COLUMN_DEFAULTS[table],
        ...payload,
      }
      const missing = findNotNullViolation(table, row)
      if (missing) {
        return sendError(
          res, 400, '23502',
          `null value in column "${missing}" of relation "${table}" violates not-null constraint`,
          `Failing row contains stub-generated values.`
        )
      }
      // users.email 은 전역 unique — send-verify 의 409 경로가 재현되어야 한다.
      if (table === 'users' && rowsOf('users').some((u) => u.email === row.email)) {
        return sendError(
          res, 409, '23505',
          'duplicate key value violates unique constraint "users_email_key"'
        )
      }
      rowsOf(table).push(row)
      inserted.push(row)
    }
    if (!wantsRepresentation(req)) {
      res.writeHead(201, { 'Content-Type': 'application/json' })
      return res.end()
    }
    return sendRows(req, res, project(table, inserted, selectSpec), inserted.length)
  }

  if (req.method === 'PATCH') {
    const body = await readBody(req)
    const targets = applyFilters(rowsOf(table), params)
    for (const row of targets) {
      Object.assign(row, body)
      // updated_at 자동 갱신 트리거 대역(001_init.sql 의 touch_updated_at).
      if ('updated_at' in row) row.updated_at = new Date().toISOString()
    }
    if (!wantsRepresentation(req)) {
      res.writeHead(204, {})
      return res.end()
    }
    return sendRows(req, res, project(table, targets, selectSpec), targets.length)
  }

  if (req.method === 'DELETE') {
    const targets = applyFilters(rowsOf(table), params)
    tables[table] = rowsOf(table).filter((row) => !targets.includes(row))
    if (!wantsRepresentation(req)) {
      res.writeHead(204, {})
      return res.end()
    }
    return sendRows(req, res, project(table, targets, selectSpec), targets.length)
  }

  return sendError(res, 405, 'STUB', `미지원 메서드: ${req.method}`)
}

reset('twoCouples')

createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  try {
    if (url.pathname.startsWith('/__control')) return await handleControl(req, res, url)
    if (url.pathname.startsWith('/rest/v1/')) return await handleRest(req, res, url)
    return sendError(res, 404, 'STUB', `알 수 없는 경로: ${url.pathname}`)
  } catch (err) {
    // 스텁의 미지원 기능은 조용히 빈 결과가 되면 안 된다 — 원인을 그대로 드러낸다.
    console.error('[stub]', req.method, req.url, '→', err)
    sendError(res, 500, 'STUB_ERROR', String(err?.message ?? err))
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`[stub] PostgREST 스텁 대기 중 — http://127.0.0.1:${PORT} (시나리오: ${scenario})`)
})
