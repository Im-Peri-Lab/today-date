import { describe, expect, it } from 'vitest'
import { ServerTiming, sanitizeTimingName } from './serverTiming'

describe('ServerTiming', () => {
  it('구간명과 ms 만 name;dur= 형식으로 낸다', async () => {
    const st = new ServerTiming('home')
    await st.time('stats', async () => 1)
    st.add('users', 12.345)
    const header = st.toHeader()
    expect(header).toMatch(/^home-stats;dur=\d+\.\d, home-users;dur=12\.3$/)
  })

  it('counted 구간은 호출 횟수를 -xN 으로 붙이고 dur 는 합산한다', () => {
    const st = new ServerTiming()
    st.declare('getcouple')
    expect(st.toHeader()).toBe('getcouple-x0;dur=0.0')
    st.add('getcouple', 10, { counted: true })
    st.add('getcouple', 5, { counted: true })
    expect(st.toHeader()).toBe('getcouple-x2;dur=15.0')
  })

  it('예외가 나도 시간을 기록하고 예외를 다시 던진다', async () => {
    const st = new ServerTiming()
    await expect(st.time('db', async () => { throw new Error('boom') })).rejects.toThrow('boom')
    expect(st.toHeader()).toMatch(/^db;dur=/)
  })

  it('이름에서 허용 문자 외에는 지운다(ID·이메일이 섞여도 값이 새지 않게)', () => {
    expect(sanitizeTimingName('a@b.com;dur=1, x')).toBe('a-b-com-dur-1-x')
  })

  it('apply 는 기존 Server-Timing 을 지우지 않고 덧붙인다', () => {
    const res = new Response(null, { headers: { 'Server-Timing': 'mw-total;dur=1.0' } })
    const st = new ServerTiming('api')
    st.add('db', 2)
    st.apply(res)
    expect(res.headers.get('Server-Timing')).toBe('mw-total;dur=1.0, api-db;dur=2.0')
  })
})
