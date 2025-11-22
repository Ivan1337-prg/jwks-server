// ----------- LOAD ENV FIRST (before anything else) -----------------
import dotenv from 'dotenv';
dotenv.config();

// ----------- IMPORTS -----------------------------------------------
import express from 'express';
import jwksRoutes from './routes/jwks.js';
import authRoutes from './routes/auth.js';
import registerRoutes from './routes/register.js';
import { initializeKeys } from './keys.js';

// ----------- SERVER SETUP ------------------------------------------
const app = express();
app.use(express.json());

// Routes
app.use(jwksRoutes);
app.use(authRoutes);
app.use(registerRoutes);

// Root endpoint
app.get('/', (req, res) => res.status(200).send("JWKS Server running"));

// 404
app.use((req, res) => {
    return res.status(404).json({ error: "Not Found" });
});

// ----------- START SERVER ------------------------------------------
const PORT = process.env.PORT || 8080;

initializeKeys().then(() => {
    if (process.env.NODE_ENV !== "test") {
        app.listen(PORT, () =>
            console.log(`http://localhost:${PORT}`)
        );
    }
});

export default app;
