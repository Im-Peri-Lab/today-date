export function getVerifyEmailTemplate(verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>이메일 인증</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(109,40,217,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#6d28d9,#8b5cf6);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:28px;">💜</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Today Date</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#1f1f1f;font-size:20px;font-weight:700;">이메일 인증</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                아래 버튼을 눌러 이메일 주소를 인증하고<br>패스코드 설정을 완료하세요.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:10px;background:#6d28d9;">
                    <a href="${verifyUrl}" style="display:inline-block;padding:14px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:10px;">
                      이메일 인증하기
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">
                이 링크는 <strong>1시간</strong> 후 만료됩니다.<br>
                본인이 요청하지 않았다면 이 메일을 무시하세요.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background:#faf5ff;border-top:1px solid #ede9fe;">
              <p style="margin:0;color:#a78bfa;font-size:12px;text-align:center;">Today Date — 우리 둘만의 데이트 기록</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function getResetPasscodeTemplate(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>패스코드 재설정</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(109,40,217,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#6d28d9,#8b5cf6);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:28px;">🔐</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Today Date</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#1f1f1f;font-size:20px;font-weight:700;">패스코드 재설정</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                패스코드 재설정 요청이 있었습니다.<br>
                아래 버튼을 눌러 새 패스코드를 설정하세요.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:10px;background:#6d28d9;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:10px;">
                      패스코드 재설정하기
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">
                이 링크는 <strong>30분</strong> 후 만료됩니다.<br>
                본인이 요청하지 않았다면 이 메일을 무시하세요.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background:#faf5ff;border-top:1px solid #ede9fe;">
              <p style="margin:0;color:#a78bfa;font-size:12px;text-align:center;">Today Date — 우리 둘만의 데이트 기록</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
