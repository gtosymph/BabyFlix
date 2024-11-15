const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static('public'));

// Gérer les connexions Socket.io
io.on('connection', (socket) => {
    console.log('Un client est connecté');

    // Recevoir les données vidéo du client caméra
    socket.on('video-stream', (data) => {
        // Diffuser les données vidéo à tous les clients moniteurs
        socket.broadcast.emit('video-stream', data);
    });

    socket.on('disconnect', () => {
        console.log('Un client est déconnecté');
    });
});

// Démarrer le serveur
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
