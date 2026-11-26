# 🌭 Chorizo Run v2.0

Videojuego arcade para navegador hecho con **HTML5 + JavaScript puro** (canvas, sin dependencias ni build).

Eres un chorizo en una cocina que debe sobrevivir a lo que cae del cielo y a los miniboss. Al empezar cada partida aparece una pequeña explicación en pantalla.

## Cómo jugar

Abre `index.html` en cualquier navegador, o juega en línea con GitHub Pages:
`https://<tu-usuario>.github.io/Chorizo/`

### Controles

- **Móvil (táctil)**: botones **◀ ▶** superpuestos en las esquinas inferiores (mantén pulsado) o arrastra el dedo por el juego; toca la pantalla para empezar / reintentar / continuar
- **Ordenador**: **← →** o **A / D**, o el ratón; **ESPACIO / ENTER** o clic para empezar / reintentar / continuar
- Botón **🔊** arriba a la derecha para silenciar/activar sonido y música

## Reglas de la v2.0

- ✅ **Recoge**: 🪙 (+10), 🫒 (+5), 🍞 (+20), 🍷 (+30, raro), ⭐ (+50, muy raro)
- 🔥 **Combo**: cada objeto bueno seguido sube la racha y suma hasta +10 extra (`Combo xN` en pantalla); un golpe lo reinicia
- ❌ **Esquiva**: 🔥 🗡 🪰 y 🧨 (bomba grande). Cada impacto quita 1 ❤️ de 3, con 1,6 s de invulnerabilidad
- 📈 **Niveles por puntos**: subes de nivel cada **100 puntos** (barra de progreso arriba); cada nivel aumenta la velocidad y los peligros
- 🐕 **Miniboss**: cada **3 niveles** aparece un perro gigante 12 s; si sobrevives: **+150 puntos y +1 ❤️**
- ⏸️ **Pausa automática** al cambiar de pestaña o bloquear el móvil
- 🎵 **Música y sonidos** con WebAudio (sin archivos), con botón de silencio
- 💾 **Récord** guardado en el navegador; sobrevivir suma 2 puntos/segundo
- La dificultad empieza suave y va subiendo poco a poco

## Cambios del rework v2.0

- Nueva estética de **cocina**: azulejos, estantería con tarros, encimera de madera, chorizo redibujado (moteado, brillo y lazos) y objetos con halo de color
- HUD renovado con **barra de progreso al siguiente nivel**
- Ritmo más suave al inicio y subida de dificultad más gradual
- Controles táctiles **superpuestos en las esquinas** de la pantalla (más cómodos con el pulgar)
- **Música de fondo** tipo chiptune + botón 🔊/🔇
- Nuevo objeto ⭐ (+50)

## Estructura

- `index.html` — página del juego
- `style.css` — estilos (botones táctiles superpuestos y botón de sonido)
- `game.js` — motor del juego: bucle, físicas, colisiones, partículas, niveles, miniboss, música, sonidos, HUD

## Historial de versiones

- **v1.0**: juego base (esquivar/recoger, 3 vidas, récord local) + versión móvil con botones táctiles
- **v1.1**: explicación inicial en partida, niveles por puntos, miniboss 🐕 cada 3 niveles, combo, sonidos, pausa automática, 🍷 y 🧨
- **v2.0 (rework)**: estética de cocina, HUD con progreso de nivel, dificultad más suave, controles superpuestos, música con silencio, ⭐
