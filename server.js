const express = require('express');
const session = require('express-session');
const axios = require('axios');
const app = express();

// Настройка сессий
app.use(session({
    secret: 'some-secret-key',
    resave: false,
    saveUninitialized: true
}));

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'https://my-vercel-project-phmj76mim-flugeheimens-projects.vercel.app/callback';

// Главная страница
app.get('/', (req, res) => {
    if (req.session.user) {
        res.send(`<h1>Hello, ${req.session.user.username}!</h1><img src="${req.session.user.avatar}" alt="Avatar" /><br><a href="/logout">Logout</a>`);
    } else {
        res.send('<h1>Welcome to Flugeheimen Bot</h1><a href="/login">Login with Discord</a>');
    }
});

// Маршрут для аутентификации
app.get('/login', (req, res) => {
    const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(authorizeUrl);
});

// Обработка редиректа от Discord
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.redirect('/');
    }

    try {
        // Обмен кода на токен
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const accessToken = tokenResponse.data.access_token;

        // Получение данных о пользователе
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const user = userResponse.data;

        // Сохранение данных о пользователе в сессии
        req.session.user = {
            username: user.username,
            avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        };

        res.redirect('/');
    } catch (error) {
        console.error('Ошибка аутентификации:', error);
        res.redirect('/');
    }
});

// Маршрут для выхода
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
