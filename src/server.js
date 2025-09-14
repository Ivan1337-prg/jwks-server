//boots the server and hooks up /jwks + /auth routes
import express from 'express'
import jwks from './routes/jwks.js'
import auth from './routes/auth.js'
import { initializeKeys } from './keys.js'

const app = express()
app.use(express.json())
app.use(jwks)
app.use(auth)

export const appReady = initializeKeys()

const PORT = process.env.PORT || 8080
appReady.then(() => {
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`http://localhost:${PORT}`))
  }
})

export default app
