#!/bin/bash

echo "==> Entrando al directorio del proyecto..."
cd /storage/emulated/0/Download/jodidos || exit

echo "==> Configurando permisos seguros de Git..."
git config --global --add safe.directory /storage/emulated/0/Download/jodidos

echo "==> Añadiendo todos los archivos y carpetas..."
git add .

echo "==> Realizando commit..."
git commit -m "Actualizacion completa de NorrosRata.com con estilos y assets"

echo "==> Configurando rama principal y remoto..."
git branch -M main
git remote remove origin 2>/dev/null
git remote add origin https://github.com/loslocos817yt-star/NorrosRata.com.git

echo "==> Subiendo cambios a GitHub..."
git push -u origin main

echo "¡Proceso finalizado con éxito!"

