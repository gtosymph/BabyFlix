const socket = io();
const localVideo = document.getElementById('localVideo');
let localStream;
let peerConnection;
const servers = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    }
  ]
};

async function startStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    localVideo.srcObject = localStream;
    createPeerConnection();
  } catch (error) {
    console.error('Erreur lors de l\'accès à la caméra :', error);
  }
}

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(servers);
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', event.candidate);
    }
  };

  peerConnection.onnegotiationneeded = async () => {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', offer);
    } catch (error) {
      console.error('Erreur lors de la création de l\'offre :', error);
    }
  };
}

socket.on('answer', async (answer) => {
  try {
    await peerConnection.setRemoteDescription(answer);
  } catch (error) {
    console.error('Erreur lors de la configuration de la description distante :', error);
  }
});

socket.on('ice-candidate', async (candidate) => {
  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du candidat ICE :', error);
  }
});

startStream();
