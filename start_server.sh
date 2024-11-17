#!/bin/bash

# Naviguer vers le répertoire du projet
cd "$(dirname "$0")"

# Installer les dépendances
npm install

# Démarrer le serveur
node server.js
