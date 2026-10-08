/**
 * 닉네임이 있으면 닉네임, 없으면 이메일로 폴백한다.
 *
 * 공간이 좁아 이메일+닉네임을 함께 보여줄 수 없는 곳(메뉴 항목 등)에서 쓴다 — 상대를
 * 가리키는 "유일한 한 표시"가 필요한 자리다. 둘 다 보여줄 여유가 있는 화면(예:
 * /partner/info)은 이 함수를 쓰지 않고 이메일·닉네임을 각자 별도 행으로 그린다.
 */
export function displayName(nickname: string | null, email: string): string {
  return nickname ?? email
}
