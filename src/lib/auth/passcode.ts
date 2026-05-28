import bcrypt from 'bcryptjs'

const COST = 10

export async function hashPasscode(passcode: string): Promise<string> {
  return bcrypt.hash(passcode, COST)
}

export async function verifyPasscode(passcode: string, hash: string): Promise<boolean> {
  return bcrypt.compare(passcode, hash)
}
