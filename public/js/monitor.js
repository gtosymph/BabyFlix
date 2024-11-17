const socket = io();
const remoteVideo = document.getElementById('remoteVideo');
let peerConnection;
const servers = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    }
  ]
};

// Fonction pour créer la connexion peer-to-peer
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(servers);

  // Ajout des candidats ICE reçus au pair
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', event.candidate);
    }
  };

  // Définir la vidéo distante lorsqu'une piste est reçue
  peerConnection.ontrack = (event) => {
    if (remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
    }
  };
}

// Réagir à une offre envoyée par le diffuseur
socket.on('offer', async (offer) => {
  if (!peerConnection) {
    createPeerConnection();
  }

  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
  } catch (error) {
    console.error('Erreur lors de la gestion de l\'offre :', error);
  }
});

// Réagir aux candidats ICE envoyés par le diffuseur
socket.on('ice-candidate', async (candidate) => {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error('Erreur lors de l\'ajout du candidat ICE :', error);
  }
});
