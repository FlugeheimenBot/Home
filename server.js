const express = require('express');
const session = require('express-session');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка сессий
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
}));

// Маршрут для входа в Discord
app.get('/login', (req, res) => {
    const redirectUri = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(redirectUri);
});

// Маршрут для обработки обратного вызова
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) return res.send('No code provided');

    try {
        const data = {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: process.env.REDIRECT_URI,
            code,
            scope: 'identify',
        };

        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams(data), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        req.session.user = userResponse.data;
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.send('Error occurred during authentication');
    }
});

// Главная страница
app.get('/', (req, res) => {
    if (req.session.user) {
        res.send(`
            <h1>Добро пожаловать, ${req.session.user.username}</h1>
            <img src="https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png" alt="avatar" width="80">
        `);
    } else {
        res.send('<a href="/login">Войти с Discord</a>');
    }
});

app.listen(PORT, () => console.log(`Сервер запущен на https://flugeheimenbot.github.io/Home/`));
