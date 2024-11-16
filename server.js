// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static('public'));

// Initialiser les seuils avec des valeurs par défaut
let motionThreshold = 30;
let noiseThreshold = 0.02;

// Gérer les connexions Socket.io
io.on('connection', (socket) => {
    console.log('Un client est connecté');

    // Envoyer les seuils actuels au nouveau client
    socket.emit('thresholds', { motionThreshold, noiseThreshold });

    // Recevoir les données vidéo du client caméra et les diffuser aux moniteurs
    socket.on('video-stream', (data) => {
        socket.broadcast.emit('video-stream', data);
    });

    // Recevoir les alertes du client caméra et les diffuser aux moniteurs
    socket.on('alert', (data) => {
        socket.broadcast.emit('alert', data);
        console.log('Alerte diffusée:', data);
    });

    // Recevoir les mises à jour des seuils depuis le moniteur et les diffuser à la caméra
    socket.on('update-thresholds', (data) => {
        if (data.motionThreshold !== undefined) motionThreshold = data.motionThreshold;
        if (data.noiseThreshold !== undefined) noiseThreshold = data.noiseThreshold;
        socket.broadcast.emit('thresholds', { motionThreshold, noiseThreshold });
        console.log('Seuils mis à jour:', { motionThreshold, noiseThreshold });
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
