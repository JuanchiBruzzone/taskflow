import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

export function generateTestJWT(userId: string): string {
  return jwt.sign(
    { userId, email: 'pact@test.com' },
    JWT_SECRET,
    { expiresIn: '1h' },
  )
}
