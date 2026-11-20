/**
 * [진단 전용 — diag/loading-server-timing, 머지 금지]
 *
 * 구간별 처리 시간을 Server-Timing 헤더(`name;dur=ms`)로 내보내는 최소 계측 도구.
 * DevTools → Network → 요청 → Timing 탭의 "Server Timing" 에 구간별 ms 가 보인다.
 *
 * 헤더 값에는 구간명과 ms 만 들어간다 — 구간명은 코드에 박힌 고정 문자열이고
 * [a-z0-9-] 외 문자는 지워지므로 ID·이메일·쿼리 내용이 섞일 수 없다.
 *
 * 같은 구간명을 여러 번 재면 dur 는 합산된다. counted 구간은 호출 횟수를 이름 뒤에
 * `-x{n}` 으로 붙인다(0회도 `-x0` 으로 남겨 "캐시 hit 이라 안 불렀다"가 보이게).
 *
 * Next 14 는 라우트 응답 헤더를 appendHeader 로 붙이므로(next/dist/server/send-response.js),
 * 미들웨어가 넣은 Server-Timing 과 라우트가 넣은 Server-Timing 이 둘 다 응답에 남는다.
 * 그래서 미들웨어 구간은 `mw-` 접두사로, 라우트 구간은 라우트별 접두사로 구분한다.
 */

type Entry = { dur: number; count: number; counted: boolean }

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

export function sanitizeTimingName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 48) || 'x'
}

export class ServerTiming {
  private readonly startedAt = now()
  private readonly entries = new Map<string, Entry>()

  constructor(private readonly prefix = '') {}

  private entry(name: string, counted: boolean): Entry {
    const key = sanitizeTimingName(this.prefix ? `${this.prefix}-${name}` : name)
    let e = this.entries.get(key)
    if (!e) {
      e = { dur: 0, count: 0, counted }
      this.entries.set(key, e)
    }
    if (counted) e.counted = true
    return e
  }

  /** ms 를 직접 더한다. */
  add(name: string, ms: number, opts: { counted?: boolean } = {}) {
    const e = this.entry(name, !!opts.counted)
    e.dur += ms
    e.count += 1
  }

  /** counted 구간을 0회로라도 등록해 둔다(호출되지 않았다는 사실도 측정값이다). */
  declare(name: string) {
    this.entry(name, true)
  }

  /** fn 실행 시간을 잰다. 예외가 나도 시간은 기록하고 예외는 그대로 던진다. */
  async time<T>(name: string, fn: () => PromiseLike<T> | T, opts: { counted?: boolean } = {}): Promise<T> {
    const t = now()
    try {
      return await fn()
    } finally {
      this.add(name, now() - t, opts)
    }
  }

  /** 생성 시점부터 지금까지를 name 구간으로 기록한다. */
  total(name = 'total') {
    this.add(name, now() - this.startedAt)
  }

  toHeader(): string {
    const parts: string[] = []
    this.entries.forEach((e, key) => {
      const name = e.counted ? `${key}-x${e.count}` : key
      parts.push(`${name};dur=${e.dur.toFixed(1)}`)
    })
    return parts.join(', ')
  }

  /** 응답에 Server-Timing 을 덧붙인다(기존 값은 지우지 않는다). 응답을 그대로 돌려준다. */
  apply<R extends Response>(res: R): R {
    const value = this.toHeader()
    if (value) res.headers.append('Server-Timing', value)
    return res
  }

  /** 서버 로그용 한 줄(Vercel Runtime Logs 에서 grep 용). 구간명과 ms 만 담는다. */
  log(label: string) {
    console.info(`[server-timing] ${sanitizeTimingName(label)} ${this.toHeader()}`)
  }
}
