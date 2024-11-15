#!/bin/bash

# setup.sh - Script d'installation et de démarrage pour BabyFlix

# Activer l'arrêt du script en cas d'erreur
set -e

echo "===== Mise à jour des paquets ====="
pkg update && pkg upgrade -y

echo "===== Installation de Git et Node.js ====="
pkg install -y git nodejs

echo "===== Vérification de Git ====="
if ! command -v git &> /dev/null
then
    echo "Git n'est pas installé. Installation échouée."
    exit 1
fi

echo "===== Vérification de Node.js ====="
if ! command -v node &> /dev/null
then
    echo "Node.js n'est pas installé. Installation échouée."
    exit 1
fi

echo "===== Installation des dépendances Node.js ====="
npm install

echo "===== Démarrage du serveur BabyFlix ====="
node server.js
