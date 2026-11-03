import { describe, it, expect } from 'vitest'
import { classifyScheduleSave } from './scheduleChange'

describe('classifyScheduleSave — 이전 값 있음 + 실제 변경일 때만 changed', () => {
  it('이전 날짜가 없으면 처음 등록(created)', () => {
    expect(classifyScheduleSave({ date: null }, { date: '2026-12-19' })).toBe('created')
    expect(classifyScheduleSave({}, { date: '2026-12-19', time: '19:00' })).toBe('created')
  })

  it('방문 예정: 날짜가 바뀌면 changed', () => {
    expect(classifyScheduleSave({ date: '2026-12-19' }, { date: '2026-12-20' })).toBe('changed')
  })

  it('방문 예정: 시간만 바뀌어도 changed(추가·변경·삭제 모두), DB 의 HH:mm:ss 와 HH:mm 은 같은 값', () => {
    expect(classifyScheduleSave({ date: '2026-12-19', time: null }, { date: '2026-12-19', time: '19:00' })).toBe('changed')
    expect(classifyScheduleSave({ date: '2026-12-19', time: '19:00:00' }, { date: '2026-12-19', time: '20:00' })).toBe('changed')
    expect(classifyScheduleSave({ date: '2026-12-19', time: '19:00:00' }, { date: '2026-12-19', time: null })).toBe('changed')
    expect(classifyScheduleSave({ date: '2026-12-19', time: '19:00:00' }, { date: '2026-12-19', time: '19:00' })).toBe('unchanged')
  })

  it('방문 기록: 시작일 또는 종료일이 바뀌면 changed', () => {
    expect(classifyScheduleSave({ date: '2026-10-01', end: null }, { date: '2026-10-02', end: null })).toBe('changed')
    expect(classifyScheduleSave({ date: '2026-10-01', end: null }, { date: '2026-10-01', end: '2026-10-03' })).toBe('changed')
    expect(classifyScheduleSave({ date: '2026-10-01', end: '2026-10-03' }, { date: '2026-10-01', end: null })).toBe('changed')
  })

  it('그대로 재저장(별점·후기만 수정 포함)은 unchanged, 빈 문자열은 null 과 같다', () => {
    expect(classifyScheduleSave({ date: '2026-10-01', end: null }, { date: '2026-10-01', end: '' })).toBe('unchanged')
    expect(classifyScheduleSave({ date: '2026-12-19', time: '' }, { date: '2026-12-19', time: null })).toBe('unchanged')
  })

  it('저장 후 날짜가 없으면 unchanged(알릴 일정 없음)', () => {
    expect(classifyScheduleSave({ date: '2026-10-01' }, { date: null })).toBe('unchanged')
    expect(classifyScheduleSave({ date: null }, { date: '' })).toBe('unchanged')
  })
})
