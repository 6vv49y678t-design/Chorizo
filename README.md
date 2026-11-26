# 🌭 Chorizo Run

Videojuego arcade para navegador hecho con **HTML5 + JavaScript puro** (canvas, sin dependencias ni build).

Eres un chorizo que debe sobrevivir: esquiva lo que cae del cielo que hace daño y recoge lo bueno para sumar puntos. La velocidad aumenta con el tiempo.

## Cómo jugar

Abre `index.html` en cualquier navegador, o publícalo con GitHub Pages.

### Controles

- **← →** o **A / D**: moverse
- **Ratón** o **dedo** (tocar y arrastrar): moverte hacia donde apuntas
- **ESPACIO / ENTER** o tocar la pantalla: empezar / reintentar

### Reglas

- ✅ Recoge: 🪙 (+10), 🫒 (+5), 🍞 (+20)
- ❌ Esquiva: 🔥 🗡 🪰 — cada impacto quita una vida (tienes ❤️❤️❤️)
- Sobrevive para sumar puntos extra con el tiempo
- El récord se guarda en el navegador (`localStorage`)

## Estructura

- `index.html` — página del juego
- `style.css` — estilos
- `game.js` — motor del juego (bucle, físicas, colisiones, partículas, HUD)
