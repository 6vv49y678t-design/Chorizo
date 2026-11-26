# 🌭 Chorizo Run v1.1

Videojuego arcade para navegador hecho con **HTML5 + JavaScript puro** (canvas, sin dependencias ni build).

Eres un chorizo que debe sobrevivir a lo que cae del cielo y a los miniboss. Al empezar cada partida aparece una pequeña explicación en pantalla.

## Cómo jugar

Abre `index.html` en cualquier navegador, o juega en línea con GitHub Pages:
`https://<tu-usuario>.github.io/Chorizo/`

### Controles

- **Móvil (táctil)**: botones **◀ ▶** en pantalla (mantén pulsado) o arrastra el dedo por el canvas; toca la pantalla para empezar / reintentar / continuar
- **Ordenador**: **← →** o **A / D**, o el ratón; **ESPACIO / ENTER** o clic para empezar / reintentar / continuar

## Reglas de la v1.1

- ✅ **Recoge**: 🪙 (+10), 🫒 (+5), 🍞 (+20), 🍷 (+30, raro)
- 🔥 **Combo**: cada objeto bueno recogido de seguito sube el combo y suma hasta +10 puntos extra; se muestra `Combo xN` en pantalla. Un golpe lo reinicia.
- ❌ **Esquiva**: 🔥 🗡 🪰 y 🧨 (bomba grande). Cada impacto quita 1 ❤️ (tienes 3), con invulnerabilidad breve después.
- 📈 **Niveles por puntos**: subes de nivel cada **100 puntos**. Cada nivel aumenta la velocidad de caída y la frecuencia de peligros. Se anuncia con `¡NIVEL N!`.
- 🐕 **Miniboss**: cada **3 niveles** aparece un perro gigante que cruza la pantalla durante **12 segundos** mientras caen más peligros. Si sobrevives, ganas **+150 puntos y +1 ❤️**. Si te toca, pierdes una vida como cualquier peligro.
- ⏸️ **Pausa automática**: si cambias de pestaña o bloqueas el móvil, el juego se pausa solo; toca la pantalla para continuar.
- 🔊 **Sonidos**: efectos incluidos con WebAudio (sin archivos de audio): recoger, golpe, nivel, miniboss, game over y récord.
- 💾 El **récord** se guarda en el navegador (`localStorage`).
- Sobrevivir también suma 2 puntos por segundo.

## Estructura

- `index.html` — página del juego
- `style.css` — estilos (incluye botones táctiles en móvil)
- `game.js` — motor del juego: bucle, físicas, colisiones, partículas, niveles, miniboss, sonidos, HUD

## Historial de versiones

- **v1.0**: juego base (esquivar/recoger, 3 vidas, récord local) + versión móvil con botones táctiles
- **v1.1**: explicación inicial en partida, niveles por puntos, miniboss 🐕 cada 3 niveles, combo, sonidos, pausa automática, nuevos objetos 🍷 y 🧨
