const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const API_KEY = 'qasim-dev';

// Serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- API PROXY ENDPOINTS ---

// AI Chat Proxy (Gemini)
app.get('/api/ai-chat', async (req, res) => {
  const userText = req.query.text || 'hello';
  try {
    const response = await axios.get(`https://api.qasimdev.dpdns.org/api/gemini/flash?text=${encodeURIComponent(userText)}&apiKey=${API_KEY}`);
    
    // Filtering logic: Only return the core AI reply
    // We assume the API returns an object; we strip out token metadata here
    let data = response.data;
    if (data && typeof data === 'object') {
      delete data.input_tokens;
      delete data.output_tokens;
      delete data.total_tokens;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI response' });
  }
});

// Wallpaper Search Proxy
app.get('/api/wallpapers', async (req, res) => {
  const searchQuery = req.query.search || '';
  try {
    const response = await axios.get(`https://api.qasimdev.dpdns.org/api/wallpaper/search?search=${encodeURIComponent(searchQuery)}&apiKey=${API_KEY}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallpapers' });
  }
});

// --- ROUTING ---
// Serves your screens from the /public folder
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/forgot-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'forgot-password.html')));
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reset-password.html')));
app.get('/chat', (req, res) => res.sendFile(path.join(__dirname, 'public', 'chat.html')));
app.get('/private-chat', (req, res) => res.sendFile(path.join(__dirname, 'public', 'private-chat.html')));
app.get('/group-chat', (req, res) => res.sendFile(path.join(__dirname, 'public', 'group-chat.html')));
app.get('/ai-scout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ai-scout.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'profile.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'public', 'settings.html')));
app.get('/wallpapers', (req, res) => res.sendFile(path.join(__dirname, 'public', 'wallpapers.html')));
app.get('/find-friends', (req, res) => res.sendFile(path.join(__dirname, 'public', 'find-friends.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/support', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support.html')));

// --- SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
  console.log('User Connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('send_message', (data) => {
    // data: { room, sender, text, timestamp, type: 'text' }
    io.to(data.room).emit('receive_message', data);
  });

  socket.on('send_image', (data) => {
    // data: { room, sender, imageUrl, timestamp, type: 'image' }
    io.to(data.room).emit('receive_image', data);
  });

  socket.on('send_voice_note', (data) => {
    // data: { room, sender, audioUrl, timestamp, type: 'voice' }
    io.to(data.room).emit('receive_voice_note', data);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Anon Chat Server running at http://localhost:${PORT}`);
});

