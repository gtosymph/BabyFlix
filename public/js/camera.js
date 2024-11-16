/* public/js/camera.js */

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const video = document.getElementById('video');
    const startButton = document.getElementById('start');
    const logs = document.getElementById('logs');
    const alerts = document.getElementById('alerts');

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

    let mediaRecorder;
    let motionThreshold = 30; // Valeur par défaut
    let noiseThreshold = 0.02; // Valeur par défaut

    // Fonction pour envoyer des alertes au serveur
    function sendAlert(message) {
        socket.emit('alert', message);
    }

    // Fonction pour recevoir les nouveaux seuils
    socket.on('thresholds', (data) => {
        if (data.motionThreshold !== undefined) {
            motionThreshold = data.motionThreshold;
            log(`Seuil de mouvement mis à jour: ${motionThreshold}`);
        }
        if (data.noiseThreshold !== undefined) {
            noiseThreshold = data.noiseThreshold;
            log(`Seuil de bruit mis à jour: ${noiseThreshold}`);
        }
    });

    startButton.onclick = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            video.srcObject = stream;
            log('Accès à la caméra et au microphone autorisé.');

            // Initialiser le MediaRecorder
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8' });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    event.data.arrayBuffer().then(buffer => {
                        socket.emit('video-stream', buffer);
                        log('Données vidéo envoyées au serveur.');
                    }).catch(e => {
                        log('Erreur lors de la conversion des données vidéo: ' + e);
                    });
                }
            };

            mediaRecorder.start(100); // Envoie des données toutes les 100ms
            log('MediaRecorder démarré.');
            startButton.disabled = true;

            // Initialiser les détecteurs
            initializeMotionDetector(stream);
            initializeNoiseDetector(stream);
        } catch (e) {
            log('Erreur lors de l\'accès à la caméra/microphone: ' + e);
        }
    };

    socket.on('connect', () => {
        log('Connecté au serveur.');
    });

    socket.on('disconnect', () => {
        log('Déconnecté du serveur.');
    });

    socket.on('error', (error) => {
        log('Erreur Socket.io: ' + error);
    });

    // Détecteur de Mouvement
    function initializeMotionDetector(stream) {
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.play();

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        let previousFrame = null;

        videoElement.addEventListener('play', () => {
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            detectMotion();
        });

        function detectMotion() {
            if (videoElement.paused || videoElement.ended) {
                return;
            }

            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const currentFrame = context.getImageData(0, 0, canvas.width, canvas.height);

            if (previousFrame) {
                let motionPixels = 0;
                for (let i = 0; i < currentFrame.data.length; i += 4) {
                    const rDiff = Math.abs(currentFrame.data[i] - previousFrame.data[i]);
                    const gDiff = Math.abs(currentFrame.data[i + 1] - previousFrame.data[i + 1]);
                    const bDiff = Math.abs(currentFrame.data[i + 2] - previousFrame.data[i + 2]);

                    const totalDiff = rDiff + gDiff + bDiff;
                    if (totalDiff > motionThreshold) {
                        motionPixels++;
                    }
                }

                const motionPercentage = (motionPixels / (currentFrame.data.length / 4)) * 100;
                if (motionPercentage > 1) { // Seuil de détection de mouvement (1%)
                    log('Mouvement détecté.');
                    showAlert('Mouvement détecté!');
                    sendAlert('Mouvement détecté!');
                }
            }

            previousFrame = currentFrame;
            requestAnimationFrame(detectMotion);
        }
    }

    // Détecteur de Bruit
    function initializeNoiseDetector(stream) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);

        scriptProcessor.onaudioprocess = () => {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            let values = 0;

            for (let i = 0; i < array.length; i++) {
                values += array[i];
            }

            const average = values / array.length / 256; // Normaliser entre 0 et 1

            if (average > noiseThreshold) {
                log('Bruit détecté.');
                showAlert('Bruit détecté!');
                sendAlert('Bruit détecté!');
            }
        };
    }
});
