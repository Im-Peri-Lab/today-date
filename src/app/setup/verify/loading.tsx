import { AuthLayout } from '@/components/auth/AuthLayout'
import styles from '@/components/auth/auth.module.css'

// 서버에서 토큰을 검증하는 동안 Next 가 보여주는 로딩 UI.
// verify 로직(page.tsx)은 그대로 두고, 빈 화면 대신 통일된 인증 화면을 깐다.
export default function VerifyLoading() {
  return (
    <AuthLayout subtitle="인증을 확인하고 있어요" pulse>
      <p className={styles.hint}>인증 확인 중...</p>
    </AuthLayout>
  )
}
