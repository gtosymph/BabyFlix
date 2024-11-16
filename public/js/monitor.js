/* public/js/monitor.js */

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const video = document.getElementById('video');
    const logs = document.getElementById('logs');
    const alerts = document.getElementById('alerts');

    const motionSlider = document.getElementById('motionThreshold');
    const noiseSlider = document.getElementById('noiseThreshold');
    const motionValue = document.getElementById('motionValue');
    const noiseValue = document.getElementById('noiseValue');

    function log(message) {
        const timestamp = new Date().toLocaleTimeString();
        logs.textContent += `[${timestamp}] ${message}\n`;
        logs.scrollTop = logs.scrollHeight;
    }

    function showAlert(message) {
        alerts.textContent = message;
        alerts.style.display = 'block';
        setTimeout(() => {
            alerts.style.display = 'none';
        }, 5000); // Masquer après 5 secondes
    }

    // Mettre à jour les valeurs des sliders et envoyer les nouvelles seuils au serveur
    motionSlider.oninput = function() {
        motionValue.textContent = this.value;
        sendThresholds();
    };

    noiseSlider.oninput = function() {
        noiseValue.textContent = this.value;
        sendThresholds();
    };

    function sendThresholds() {
        const motionThreshold = parseInt(motionSlider.value);
        const noiseThreshold = parseFloat(noiseSlider.value);
        socket.emit('update-thresholds', { motionThreshold, noiseThreshold });
        log(`Seuils mis à jour: Mouvement=${motionThreshold}, Bruit=${noiseThreshold}`);
    }

    socket.on('thresholds', (data) => {
        if (data.motionThreshold !== undefined) {
            motionSlider.value = data.motionThreshold;
            motionValue.textContent = data.motionThreshold;
        }
        if (data.noiseThreshold !== undefined) {
            noiseSlider.value = data.noiseThreshold;
            noiseValue.textContent = data.noiseThreshold;
        }
        log(`Seuils reçus: Mouvement=${data.motionThreshold}, Bruit=${data.noiseThreshold}`);
    });

    socket.on('video-stream', (data) => {
        log('Données vidéo reçues sur le moniteur.');
        try {
            sourceBuffer.appendBuffer(new Uint8Array(data));
            log('Données vidéo ajoutées au SourceBuffer.');
        } catch (e) {
            log('Erreur lors de l\'ajout des données au SourceBuffer: ' + e);
        }
    });

    socket.on('alert', (message) => {
        log('Alerte reçue: ' + message);
        showAlert(message);
    });

    // Gestion du MediaSource
    let mediaSource = new MediaSource();
    video.src = URL.createObjectURL(mediaSource);

    let sourceBuffer;

    mediaSource.addEventListener('sourceopen', () => {
        try {
            sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs=vp8');
            sourceBuffer.mode = 'segments';
            log('SourceBuffer créé et MediaSource ouvert.');
        } catch (e) {
            log('Erreur lors de l\'ajout du SourceBuffer: ' + e);
        }
    });

    mediaSource.addEventListener('error', (e) => {
        log('Erreur MediaSource: ' + e);
    });

    socket.on('connect', () => {
        log('Connecté au serveur.');
    });

    socket.on('disconnect', () => {
        log('Déconnecté du serveur.');
    });
});
