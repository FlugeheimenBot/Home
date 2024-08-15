const express = require('express');
const axios = require('axios');
const session = require('express-session');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

app.get('/', (req, res) => {
    if (req.session.user) {
        res.send(`<h1>Привет, ${req.session.user.username}</h1>
                  <a href="/logout">Выйти</a>
                  <a href="/dashboard">Перейти к панели управления ботом</a>`);
    } else {
        res.send('<a href="/login">Войти через Discord</a>');
    }
});

app.get('/login', (req, res) => {
    const redirectUri = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify guilds bot applications.commands`;
    res.redirect(redirectUri);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect('/');

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', null, {
            params: {
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenResponse.data.access_token}`,
            },
        });

        req.session.user = userResponse.data;
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    // Здесь вы можете отобразить интерфейс для управления ботом
    res.send(`<h1>Панель управления ботом</h1>
              <p>Управляйте своим ботом здесь.</p>
              <a href="/logout">Выйти</a>`);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
