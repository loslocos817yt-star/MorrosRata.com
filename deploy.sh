#!/bin/bash
git config --global --add safe.directory /storage/emulated/0/Download/jodidos
git add .
git commit -m "Actualizacion completa de NiñosRata.com con estilos y assets"
git branch -M main
git remote remove origin 2>/dev/null
git remote add origin https://github.com/loslocos817yt-star/NorrosRata.com.git
git push -u origin main

echo "¡Proceso finalizado con éxito!"

