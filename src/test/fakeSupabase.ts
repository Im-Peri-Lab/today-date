/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 인메모리 Supabase(PostgREST) 대역.
 *
 * 커플 격리는 "라우트가 couple_id 조건을 실제로 걸었는가"가 전부이므로, 호출을 세는
 * 스파이로는 검증이 약하다(조건을 걸었지만 엉뚱한 필드에 걸어도 통과한다). 그래서
 * 필터를 해석해 행을 실제로 걸러내는 대역을 두고, 라우트 핸들러를 그대로 실행한 뒤
 * 응답과 DB 최종 상태를 함께 본다 — 남의 행이 응답에 섞이거나 실제로 바뀌면 실패한다.
 *
 * 프로덕션에는 커플이 1개뿐이라 두 번째 커플로 침범 테스트를 할 수 없어, 가상의
 * 커플 B 행을 이 대역에 심어 검증한다.
 *
 * 지원 범위는 이 리포지토리의 라우트가 실제로 쓰는 연산으로 한정한다 —
 * select/insert/update/delete + eq/in/ilike/contains/or/order/limit/single/maybeSingle,
 * 그리고 head:true 카운트. 임베드 문법('*, category:...')은 파싱하지 않고 행을 그대로
 * 돌려준다(격리 판정에 열 선택은 영향이 없다).
 */

export type FakeRow = Record<string, any>
export type FakeDb = Record<string, FakeRow[]>

type Filter =
  | { op: 'eq'; field: string; value: any }
  | { op: 'in'; field: string; values: any[] }
  | { op: 'ilike'; field: string; pattern: string }
  | { op: 'contains'; field: string; values: any[] }
  | { op: 'or'; clauses: string[] }

function ilikeMatch(value: any, pattern: string): boolean {
  if (typeof value !== 'string') return false
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*')
  return new RegExp(`^${escaped}$`, 'i').test(value)
}

function matches(row: FakeRow, f: Filter): boolean {
  switch (f.op) {
    case 'eq':
      return row[f.field] === f.value
    case 'in':
      return f.values.includes(row[f.field])
    case 'ilike':
      return ilikeMatch(row[f.field], f.pattern)
    case 'contains':
      return Array.isArray(row[f.field]) && f.values.every((v) => row[f.field].includes(v))
    case 'or':
      // PostgREST or() 문법 중 라우트가 쓰는 형태(`field.ilike.%term%`)만 해석한다.
      return f.clauses.some((clause) => {
        const [field, op, ...rest] = clause.split('.')
        const arg = rest.join('.')
        if (op !== 'ilike') throw new Error(`fakeSupabase: or() 미지원 연산 ${op}`)
        return ilikeMatch(row[field], arg)
      })
  }
}

let idCounter = 0

/** gen_random_uuid() 대역 — 라우트 스키마가 uuid 형식을 요구하는 값들이 있어 형태를 맞춘다. */
function nextId() {
  idCounter += 1
  const n = String(idCounter).padStart(12, '0')
  return `aaaaaaaa-aaaa-4aaa-8aaa-${n}`
}

/**
 * 컬럼 DEFAULT 대역(§ supabase/migrations/001_init.sql).
 * 예를 들어 activities.status 는 DEFAULT 'wishlist' 이므로 POST 본문에 status 가
 * 없어도 위시리스트로 들어간다 — 이걸 재현하지 않으면 회귀 테스트가 실제 동작과
 * 어긋난다(생성한 행이 목록에 안 보이는 것처럼 관측된다).
 */
const COLUMN_DEFAULTS: Record<string, FakeRow> = {
  activities: { status: 'wishlist', time_of_day: 'any', image_urls: [], visited_at: null, rating: null, review_note: null },
  places: { status: 'wishlist', meal_times: [], image_urls: [], visited_at: null, rating: null, review_note: null },
  recommendations_log: { recommended_ids: [], selected_id: null },
}

class FakeQuery implements PromiseLike<any> {
  private filters: Filter[] = []
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private payload: FakeRow | null = null
  private wantCount = false
  private headOnly = false
  private orderBy: { field: string; ascending: boolean }[] = []
  private limitN: number | null = null

  constructor(private db: FakeDb, private table: string) {}

  private get rows(): FakeRow[] {
    if (!this.db[this.table]) this.db[this.table] = []
    return this.db[this.table]
  }

  select(_columns?: string, opts?: { count?: 'exact'; head?: boolean }) {
    if (opts?.count) this.wantCount = true
    if (opts?.head) this.headOnly = true
    return this
  }

  insert(payload: FakeRow) {
    this.mode = 'insert'
    this.payload = payload
    return this
  }

  update(payload: FakeRow) {
    this.mode = 'update'
    this.payload = payload
    return this
  }

  delete() {
    this.mode = 'delete'
    return this
  }

  eq(field: string, value: any) {
    // `.eq('couple_id', undefined)` 는 PostgREST 에서 조건이 사라진 전체 조회가 된다.
    // 격리가 조용히 풀리는 대표적 경로라 대역에서 즉시 실패로 만든다.
    if (value === undefined) throw new Error(`fakeSupabase: eq(${field}, undefined) — 필터가 사라진다`)
    this.filters.push({ op: 'eq', field, value })
    return this
  }

  in(field: string, values: any[]) {
    this.filters.push({ op: 'in', field, values })
    return this
  }

  ilike(field: string, pattern: string) {
    this.filters.push({ op: 'ilike', field, pattern })
    return this
  }

  contains(field: string, values: any[]) {
    this.filters.push({ op: 'contains', field, values })
    return this
  }

  or(expr: string) {
    this.filters.push({ op: 'or', clauses: expr.split(',') })
    return this
  }

  order(field: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orderBy.push({ field, ascending: opts?.ascending !== false })
    return this
  }

  limit(n: number) {
    this.limitN = n
    return this
  }

  private matched(): FakeRow[] {
    return this.rows.filter((row) => this.filters.every((f) => matches(row, f)))
  }

  private sortAndLimit(rows: FakeRow[]): FakeRow[] {
    const out = [...rows]
    for (const o of [...this.orderBy].reverse()) {
      out.sort((a, b) => {
        const av = a[o.field] ?? ''
        const bv = b[o.field] ?? ''
        if (av === bv) return 0
        return (av < bv ? -1 : 1) * (o.ascending ? 1 : -1)
      })
    }
    return this.limitN === null ? out : out.slice(0, this.limitN)
  }

  private run(): { data: FakeRow[]; error: null } | { data: null; error: { code: string; message: string } } {
    switch (this.mode) {
      case 'select':
        return { data: this.sortAndLimit(this.matched()), error: null }
      case 'insert': {
        const row = {
          id: nextId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...COLUMN_DEFAULTS[this.table],
          ...this.payload,
        }
        this.rows.push(row)
        return { data: [row], error: null }
      }
      case 'update': {
        const hit = this.matched()
        for (const row of hit) Object.assign(row, this.payload, { updated_at: new Date().toISOString() })
        return { data: hit, error: null }
      }
      case 'delete': {
        const hit = this.matched()
        this.db[this.table] = this.rows.filter((row) => !hit.includes(row))
        return { data: hit, error: null }
      }
    }
  }

  /** PostgREST 의 .single(): 정확히 1행이 아니면 PGRST116 오류. */
  async single() {
    const res = this.run()
    if (res.error) return res
    if (res.data.length !== 1) {
      return { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } }
    }
    return { data: res.data[0], error: null }
  }

  /** .maybeSingle(): 0행은 오류가 아니라 data:null. */
  async maybeSingle() {
    const res = this.run()
    if (res.error) return res
    if (res.data.length > 1) {
      return { data: null, error: { code: 'PGRST114', message: 'more than one row returned' } }
    }
    return { data: res.data[0] ?? null, error: null }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve()
      .then(() => {
        const res = this.run()
        if (res.error) return res
        if (this.headOnly) return { data: null, count: res.data.length, error: null }
        return this.wantCount
          ? { data: res.data, count: res.data.length, error: null }
          : { data: res.data, error: null }
      })
      .then(onfulfilled, onrejected)
  }
}

export function createFakeSupabase(db: FakeDb) {
  return {
    from(table: string) {
      return new FakeQuery(db, table)
    },
  } as any
}
