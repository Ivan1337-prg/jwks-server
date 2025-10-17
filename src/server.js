import express from 'express'
import jwks from './routes/jwks.js'
import auth from './routes/auth.js'
import { initializeKeys } from './keys.js'

const app = express()
app.use(express.json())
app.use(jwks)
app.use(auth)
app.get('/', (req, res) => res.status(200).send('JWKS Server running'))
app.use((req, res) => res.status(404).json({ error: 'Not Found' }))
const PORT = process.env.PORT || 8080
initializeKeys().then(() => {
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`http://localhost:${PORT}`))
  }
})
export default app
