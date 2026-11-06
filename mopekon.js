const seccionSala = document.getElementById("seleccionar-sala")
const seccionMascota = document.getElementById("seleccionar-mascota")
const seccionAtaque = document.getElementById("seleccionar-ataque")
const seccionMapa = document.getElementById("MAPA")
const seccionMovimiento = document.getElementById("Movimiento")
const estadoSala = document.getElementById("estado-sala")
const estadoJuego = document.getElementById("estado-juego")
const contenedorTarjetas = document.getElementById("Contenedor-Tarjetas")
const botonMascotaJugador = document.getElementById("boton-mascota")
const botonReinicio = document.getElementById("boton-reinicio")
const contenedorAtaques = document.getElementById("contenedor-Ataques")
const sectionMensajes = document.getElementById("Resultado")
const AtaquesJugador = document.getElementById("Ataques-Jugador")
const AtaquesEnemigo = document.getElementById("Ataques-Enemigo")
const spanVidasMascota = document.getElementById("vidas-mascota")
const spanVidasEnemigo = document.getElementById("vidas-enemigo")
const nuestroMapa = document.getElementById("BUSCA")
const lienzo = nuestroMapa.getContext("2d")
const imagenMapa = new Image()
imagenMapa.src = "./Material/Mapa.jpg"
const imagenJugador = new Image(80)
const imagenEnemigo = new Image(80)

AtaquesJugador.appendChild(imagenJugador)
AtaquesEnemigo.appendChild(imagenEnemigo)

const anchoMapa = Math.max(240, Math.min(780, window.innerWidth - 20))
const altoMapa = anchoMapa / 2
const nombresAtaques = ["FUEGO", "AGUA", "TIERRA", "ORO"]
const configuracionSupabase = window.SLIME_SUPABASE_CONFIG
const jugadorId = crearId()

nuestroMapa.width = anchoMapa
nuestroMapa.height = altoMapa

let clienteSupabase
let canalSala
let codigoSala
let modoJuego
let mascotaJugador
let mascotaJugadorObj
let mascotaEnemigoObj
let ataquesSlimeEnemigo = []
let enemigos = []
let ataqueJugador = []
let ataqueEnemigo = []
let botonesAtaque = []
let intervaloMapa
let combateActivo = false
let combateIniciado = false
let rondasResueltas = 0
let victoriasJugador = 0
let victoriasEnemigo = 0
let ultimaPosicionEnviada = 0
let errorPosicionMostrado = false
let rivalId
let slimeRival
let movimientoRivalAt = 0
let posicionRivalAnterior
let posicionPendiente = true

class Slime {
    constructor(nombre, foto, vida) {
        this.nombre = nombre
        this.foto = foto
        this.vida = vida
        this.ataques = []
        this.ancho = anchoMapa * 40 / 400
        this.alto = altoMapa * 40 / 200
        this.x = aleatorio(0, nuestroMapa.width - this.ancho)
        this.y = aleatorio(0, nuestroMapa.height - this.alto)
        this.velocidadX = 0
        this.velocidadY = 0
        this.mapaFoto = new Image()
        this.mapaFoto.src = foto
    }

    pintar() {
        if (this.mapaFoto.complete && this.mapaFoto.naturalWidth) {
            lienzo.drawImage(this.mapaFoto, this.x, this.y, this.ancho, this.alto)
        }
    }
}

const slimes = [
    crearSlime("Fuego", "./Material/Fuego.jpeg", 3, ["FUEGO", "AGUA", "FUEGO", "TIERRA", "FUEGO"]),
    crearSlime("Charco", "./Material/Charco.jpeg", 3, ["AGUA", "FUEGO", "AGUA", "TIERRA", "AGUA"]),
    crearSlime("Maraña", "./Material/Maraña.jpeg", 3, ["TIERRA", "AGUA", "TIERRA", "FUEGO", "TIERRA"]),
    crearSlime("Dorado", "./Material/Gold_Slime.jpeg", 6, ["ORO", "AGUA", "FUEGO", "TIERRA", "AGUA"])
]

function crearSlime(nombre, foto, vida, ataques) {
    const slime = new Slime(nombre, foto, vida)
    slime.ataques = ataques.map((ataque) => ({ nombre: ataque }))
    return slime
}

function iniciarJuego() {
    seccionAtaque.style.display = "none"
    seccionMapa.style.display = "none"
    seccionMovimiento.style.display = "none"
    botonReinicio.style.display = "none"
    slimes.forEach((slime) => {
        contenedorTarjetas.insertAdjacentHTML("beforeend", `
            <input type="radio" name="mascota" id="${slime.nombre}">
            <label class="tarjetaSlime" for="${slime.nombre}">
                <p><strong>${slime.nombre}</strong></p>
                <img src="${slime.foto}" alt="${slime.nombre}">
            </label>
        `)
    })

    document.getElementById("crear-sala").addEventListener("click", crearSala)
    document.getElementById("unirse-sala").addEventListener("click", () => {
        entrarASala(document.getElementById("codigo-sala").value)
    })
    document.getElementById("jugar-solo").addEventListener("click", iniciarModoLocal)
    document.getElementById("copiar-enlace").addEventListener("click", copiarEnlace)
    botonMascotaJugador.addEventListener("click", seleccionarMascotaJugador)
    botonReinicio.addEventListener("click", reiniciarJuego)
    configurarControles()

    const salaCompartida = new URLSearchParams(window.location.search).get("room")
    if (salaCompartida) {
        document.getElementById("codigo-sala").value = salaCompartida
        if (configuracionLista()) {
            entrarASala(salaCompartida)
        }
    }
}

function configuracionLista() {
    return Boolean(
        window.supabase &&
        typeof window.supabase.createClient === "function" &&
        configuracionSupabase &&
        configuracionSupabase.url &&
        configuracionSupabase.publishableKey &&
        !configuracionSupabase.url.includes("TU_URL") &&
        !configuracionSupabase.publishableKey.includes("TU_CLAVE")
    )
}

function crearSala() {
    if (!configuracionLista()) {
        mostrarErrorConfiguracion()
        return
    }

    const codigo = crearCodigoSala()
    document.getElementById("codigo-sala").value = codigo
    entrarASala(codigo)
}

function entrarASala(codigo) {
    const codigoLimpio = codigo.trim().toUpperCase()
    if (!/^[A-Z0-9]{6,8}$/.test(codigoLimpio)) {
        estadoSala.textContent = "El código debe tener entre 6 y 8 letras o números."
        return
    }
    if (!configuracionLista()) {
        mostrarErrorConfiguracion()
        return
    }
    if (canalSala) {
        estadoSala.textContent = "Ya estás conectado a una sala."
        return
    }

    modoJuego = "online"
    codigoSala = codigoLimpio
    desactivarControlesSala(true)
    estadoSala.textContent = "Conectando con Supabase..."

    try {
        clienteSupabase = window.supabase.createClient(
            configuracionSupabase.url,
            configuracionSupabase.publishableKey
        )
        canalSala = clienteSupabase.channel(`slime-battle-${codigoSala}`, {
            config: {
                broadcast: { self: false },
                presence: { key: jugadorId },
                private: false
            }
        })
        canalSala
            .on("presence", { event: "sync" }, actualizarPresencia)
            .on("broadcast", { event: "game" }, ({ payload }) => recibirEvento(payload))
            .subscribe(async (estado, error) => {
                if (estado === "SUBSCRIBED") {
                    try {
                        await canalSala.track({ playerId: jugadorId, ready: false })
                        document.getElementById("compartir-sala").hidden = false
                        document.getElementById("enlace-sala").value = crearEnlaceSala()
                        history.replaceState(null, "", `${window.location.pathname}?room=${codigoSala}`)
                        seccionMascota.style.display = "flex"
                        estadoSala.textContent = "Sala conectada. Comparte el enlace y elige tu slime cuando llegue tu rival."
                    } catch (trackingError) {
                        cerrarSalaConError(`No se pudo registrar tu presencia en la sala: ${trackingError.message}`)
                    }
                } else if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT") {
                    const detalle = error && error.message ? ` ${error.message}` : ""
                    cerrarSalaConError(`No se pudo conectar a la sala.${detalle}`)
                }
            })
    } catch (error) {
        canalSala = null
        desactivarControlesSala(false)
        mostrarError(`No se pudo iniciar Supabase: ${error.message}`)
    }
}

function actualizarPresencia() {
    if (!canalSala) {
        return
    }
    const presentes = Object.values(canalSala.presenceState()).flat()
    const rival = presentes.find((presencia) => presencia.playerId !== jugadorId)
    const cantidadJugadores = presentes.length

    if (cantidadJugadores > 2) {
        estadoSala.textContent = "La sala está llena. Pide a tu rival que cree otra sala."
        botonMascotaJugador.disabled = true
        return
    }

    if (!rival) {
        rivalId = null
        slimeRival = null
        estadoSala.textContent = "Esperando a tu rival. Comparte el enlace de la sala."
        return
    }

    rivalId = rival.playerId
    slimeRival = slimes.find((slime) => slime.nombre === rival.slime)
    estadoSala.textContent = rival.ready
        ? `Tu rival está listo${slimeRival ? ` con ${slimeRival.nombre}` : ""}. Elige tu slime.`
        : "¡Rival conectado! Elige tu slime."
    iniciarMapaEnLineaSiListos()
}

function recibirEvento(payload) {
    if (!payload || payload.playerId === jugadorId || payload.playerId !== rivalId) {
        return
    }

    if (payload.type === "ready" && slimes.some((slime) => slime.nombre === payload.slime)) {
        slimeRival = slimes.find((slime) => slime.nombre === payload.slime)
        estadoSala.textContent = mascotaJugador
            ? `Tu rival eligió ${slimeRival.nombre}. Esperando a que ambos estén listos...`
            : `Tu rival eligió ${slimeRival.nombre}. Elige tu slime.`
        iniciarMapaEnLineaSiListos()
    } else if (payload.type === "position" && Number.isFinite(payload.x) && Number.isFinite(payload.y)) {
        if (mascotaEnemigoObj) {
            if (!posicionRivalAnterior ||
                posicionRivalAnterior.x !== payload.x ||
                posicionRivalAnterior.y !== payload.y) {
                movimientoRivalAt = Date.now()
                posicionRivalAnterior = { x: payload.x, y: payload.y }
            }
            mascotaEnemigoObj.x = limitar(payload.x, 0, 1) * (nuestroMapa.width - mascotaEnemigoObj.ancho)
            mascotaEnemigoObj.y = limitar(payload.y, 0, 1) * (nuestroMapa.height - mascotaEnemigoObj.alto)
        }
    } else if (payload.type === "encounter" && modoJuego === "online") {
        iniciarCombateOnline()
    } else if (payload.type === "attack" && modoJuego === "online") {
        if (Number.isInteger(payload.round) && payload.round >= 0 && payload.round < 5 &&
            nombresAtaques.includes(payload.attack)) {
            ataqueEnemigo[payload.round] = payload.attack
            resolverRondasEnLinea()
        }
    }
}

function iniciarMapaEnLineaSiListos() {
    if (modoJuego !== "online" || !mascotaJugador || !slimeRival || combateIniciado) {
        return
    }
    iniciarMapa()
}

function iniciarModoLocal() {
    modoJuego = "local"
    seccionSala.style.display = "none"
    seccionMascota.style.display = "flex"
    estadoSala.textContent = "Práctica sin conexión"
}

function seleccionarMascotaJugador() {
    if (modoJuego === "online" && !rivalId) {
        estadoSala.textContent = "Espera a que tu rival se conecte antes de elegir."
        return
    }
    const seleccion = document.querySelector('input[name="mascota"]:checked')
    if (!seleccion) {
        estadoSala.textContent = "Selecciona un slime antes de continuar."
        return
    }

    mascotaJugador = slimes.find((slime) => slime.nombre === seleccion.id)
    botonMascotaJugador.disabled = true
    if (modoJuego === "online") {
        estadoSala.textContent = "Slime elegido. Esperando a que tu rival también esté listo..."
        canalSala.track({ playerId: jugadorId, ready: true, slime: mascotaJugador.nombre })
            .then((respuesta) => {
                if (respuesta !== "ok") {
                    throw new Error(`Estado de presencia inesperado: ${respuesta}`)
                }
                return enviarEvento({ type: "ready", slime: mascotaJugador.nombre })
            })
            .then(iniciarMapaEnLineaSiListos)
            .catch((error) => mostrarError(`No se pudo confirmar tu selección: ${error.message}`))
        return
    }

    seccionMascota.style.display = "none"
    iniciarMapa()
}

function iniciarMapa() {
    if (combateIniciado) {
        return
    }
    combateIniciado = true
    if (modoJuego === "online") {
        seccionSala.style.display = "none"
    }
    mascotaJugadorObj = crearSlime(mascotaJugador.nombre, mascotaJugador.foto, mascotaJugador.vida, mascotaJugador.ataques.map((ataque) => ataque.nombre))
    mascotaJugadorObj.x = 10
    mascotaJugadorObj.y = 10
    seccionMascota.style.display = "none"
    seccionMapa.style.display = "flex"
    seccionMovimiento.style.display = "flex"

    if (modoJuego === "online") {
        mascotaEnemigoObj = crearSlime(slimeRival.nombre, slimeRival.foto, slimeRival.vida, slimeRival.ataques.map((ataque) => ataque.nombre))
        if (jugadorId < rivalId) {
            mascotaEnemigoObj.x = nuestroMapa.width - mascotaEnemigoObj.ancho - 10
            mascotaEnemigoObj.y = nuestroMapa.height - mascotaEnemigoObj.alto - 10
        } else {
            mascotaJugadorObj.x = nuestroMapa.width - mascotaJugadorObj.ancho - 10
            mascotaJugadorObj.y = nuestroMapa.height - mascotaJugadorObj.alto - 10
            mascotaEnemigoObj.x = 10
            mascotaEnemigoObj.y = 10
        }
        ataquesSlimeEnemigo = slimeRival.ataques
        enviarPosicion()
    } else {
        enemigos = slimes
            .filter((slime) => slime.nombre !== mascotaJugador.nombre)
            .map((slime, index, lista) => {
                const enemigo = crearSlime(slime.nombre, slime.foto, slime.vida, slime.ataques.map((ataque) => ataque.nombre))
                enemigo.x = (index + 1) * nuestroMapa.width / (lista.length + 1) - enemigo.ancho / 2
                enemigo.y = index % 2 === 0 ? 20 : nuestroMapa.height - enemigo.alto - 20
                return enemigo
            })
    }

    intervaloMapa = setInterval(pintarCanvas, 50)
    window.addEventListener("keydown", Teclas)
    window.addEventListener("keyup", detenerSlime)
}

function pintarCanvas() {
    const xAnterior = mascotaJugadorObj.x
    const yAnterior = mascotaJugadorObj.y
    mascotaJugadorObj.x = limitar(
        mascotaJugadorObj.x + mascotaJugadorObj.velocidadX,
        0,
        nuestroMapa.width - mascotaJugadorObj.ancho
    )
    mascotaJugadorObj.y = limitar(
        mascotaJugadorObj.y + mascotaJugadorObj.velocidadY,
        0,
        nuestroMapa.height - mascotaJugadorObj.alto
    )
    lienzo.clearRect(0, 0, nuestroMapa.width, nuestroMapa.height)
    if (imagenMapa.complete && imagenMapa.naturalWidth) {
        lienzo.drawImage(imagenMapa, 0, 0, nuestroMapa.width, nuestroMapa.height)
    }

    if (modoJuego === "online") {
        if (mascotaJugadorObj.x !== xAnterior || mascotaJugadorObj.y !== yAnterior) {
            posicionPendiente = true
        }
        if (mascotaEnemigoObj) {
            mascotaEnemigoObj.pintar()
        }
        if (posicionPendiente && (mascotaJugadorObj.velocidadX !== 0 || mascotaJugadorObj.velocidadY !== 0) &&
            Date.now() - ultimaPosicionEnviada > 100) {
            enviarPosicion()
        }
        if (mascotaEnemigoObj &&
            (mascotaJugadorObj.velocidadX !== 0 || mascotaJugadorObj.velocidadY !== 0 ||
                Date.now() - movimientoRivalAt < 100)) {
            revisarColision(mascotaEnemigoObj)
        }
    } else {
        enemigos.forEach((enemigo) => enemigo.pintar())
        if (mascotaJugadorObj.velocidadX !== 0 || mascotaJugadorObj.velocidadY !== 0) {
            for (const enemigo of enemigos) {
                revisarColision(enemigo)
                if (combateActivo) {
                    break
                }
            }
        }
    }
    mascotaJugadorObj.pintar()
}

function enviarPosicion() {
    if (!canalSala || !mascotaJugadorObj) {
        return
    }
    ultimaPosicionEnviada = Date.now()
    posicionPendiente = false
    enviarEvento({
        type: "position",
        x: mascotaJugadorObj.x / Math.max(1, nuestroMapa.width - mascotaJugadorObj.ancho),
        y: mascotaJugadorObj.y / Math.max(1, nuestroMapa.height - mascotaJugadorObj.alto)
    }).then(() => {
        errorPosicionMostrado = false
    }).catch((error) => {
        if (!errorPosicionMostrado) {
            errorPosicionMostrado = true
            mostrarError(`Se perdió la conexión con la sala: ${error.message}`)
        }
    })
}

function moverSlime(dx, dy) {
    if (!mascotaJugadorObj || combateActivo) {
        return
    }
    mascotaJugadorObj.velocidadX = dx * 5
    mascotaJugadorObj.velocidadY = dy * 5
    posicionPendiente = true
}

function Teclas(evento) {
    const tecla = evento.key.toLowerCase()
    const direcciones = {
        w: [0, -1],
        arrowup: [0, -1],
        s: [0, 1],
        arrowdown: [0, 1],
        a: [-1, 0],
        arrowleft: [-1, 0],
        d: [1, 0],
        arrowright: [1, 0]
    }
    if (direcciones[tecla]) {
        evento.preventDefault()
        moverSlime(...direcciones[tecla])
    }
}

function detenerSlime() {
    if (mascotaJugadorObj) {
        const estabaMoviendose = mascotaJugadorObj.velocidadX !== 0 || mascotaJugadorObj.velocidadY !== 0
        mascotaJugadorObj.velocidadX = 0
        mascotaJugadorObj.velocidadY = 0
        if (estabaMoviendose && modoJuego === "online") {
            posicionPendiente = true
            enviarPosicion()
        }
    }
}

function configurarControles() {
    const controles = [
        ["mover-arriba", 0, -1],
        ["mover-abajo", 0, 1],
        ["mover-izquierda", -1, 0],
        ["mover-derecha", 1, 0]
    ]
    controles.forEach(([id, dx, dy]) => {
        const boton = document.getElementById(id)
        boton.addEventListener("pointerdown", (evento) => {
            evento.preventDefault()
            moverSlime(dx, dy)
        })
        boton.addEventListener("pointerup", detenerSlime)
        boton.addEventListener("pointercancel", detenerSlime)
        boton.addEventListener("pointerleave", detenerSlime)
    })
}

function revisarColision(enemigo) {
    if (combateActivo) {
        return
    }
    const sinColision = mascotaJugadorObj.x + mascotaJugadorObj.ancho < enemigo.x ||
        mascotaJugadorObj.x > enemigo.x + enemigo.ancho ||
        mascotaJugadorObj.y + mascotaJugadorObj.alto < enemigo.y ||
        mascotaJugadorObj.y > enemigo.y + enemigo.alto
    if (sinColision) {
        return
    }

    detenerSlime()
    if (modoJuego === "online") {
        if (jugadorId < rivalId) {
            enviarEvento({ type: "encounter" })
                .then(iniciarCombateOnline)
                .catch((error) => mostrarError(`No se pudo iniciar el combate: ${error.message}`))
        }
        return
    }
    iniciarCombateLocal(enemigo)
}

function iniciarCombateOnline() {
    if (combateActivo || !slimeRival) {
        return
    }
    iniciarCombate(slimeRival)
}

function iniciarCombateLocal(enemigo) {
    ataquesSlimeEnemigo = enemigo.ataques
    iniciarCombate(enemigo)
}

function iniciarCombate(enemigo) {
    combateActivo = true
    clearInterval(intervaloMapa)
    botonReinicio.style.display = "none"
    seccionAtaque.style.display = "flex"
    seccionMapa.style.display = "none"
    seccionMovimiento.style.display = "none"
    imagenJugador.src = mascotaJugador.foto
    imagenEnemigo.src = enemigo.foto
    ataqueJugador = []
    ataqueEnemigo = []
    rondasResueltas = 0
    victoriasJugador = 0
    victoriasEnemigo = 0
    spanVidasMascota.textContent = "0"
    spanVidasEnemigo.textContent = "0"
    AtaquesJugador.querySelectorAll("p").forEach((ataque) => ataque.remove())
    AtaquesEnemigo.querySelectorAll("p").forEach((ataque) => ataque.remove())
    sectionMensajes.textContent = "¡Elige tus ataques!"
    contenedorAtaques.replaceChildren()
    crearBotonesAtaque(mascotaJugador.ataques)
}

function crearBotonesAtaque(ataques) {
    ataques.forEach((ataque) => {
        const boton = document.createElement("button")
        boton.className = "Botones-de-Fuego BAtaque"
        boton.innerHTML = `<strong>${ataque.nombre}</strong>`
        boton.addEventListener("click", () => seleccionarAtaque(boton, ataque.nombre))
        contenedorAtaques.appendChild(boton)
    })
    botonesAtaque = [...contenedorAtaques.querySelectorAll(".BAtaque")]
}

function seleccionarAtaque(boton, ataque) {
    const ronda = ataqueJugador.length
    if (ronda >= 5 || boton.disabled || !nombresAtaques.includes(ataque)) {
        return
    }
    boton.disabled = true
    boton.style.background = "#BBBFCA"
    ataqueJugador.push(ataque)

    if (modoJuego === "online") {
        enviarEvento({ type: "attack", round: ronda, attack: ataque })
            .then(resolverRondasEnLinea)
            .catch((error) => mostrarError(`No se pudo enviar el ataque: ${error.message}`))
        sectionMensajes.textContent = "Ataque enviado. Esperando a tu rival..."
        return
    }

    ataqueEnemigo.push(ataquesSlimeEnemigo[aleatorio(0, ataquesSlimeEnemigo.length - 1)].nombre)
    resolverRonda(ronda, ataqueJugador[ronda], ataqueEnemigo[ronda])
    if (ataqueJugador.length === 5) {
        mostrarResultadoFinal()
    }
}

function resolverRondasEnLinea() {
    while (rondasResueltas < 5 &&
        ataqueJugador[rondasResueltas] &&
        ataqueEnemigo[rondasResueltas]) {
        resolverRonda(
            rondasResueltas,
            ataqueJugador[rondasResueltas],
            ataqueEnemigo[rondasResueltas]
        )
        rondasResueltas++
    }
    if (rondasResueltas === 5) {
        mostrarResultadoFinal()
    } else if (ataqueJugador[rondasResueltas] && !ataqueEnemigo[rondasResueltas]) {
        sectionMensajes.textContent = "Esperando el ataque de tu rival..."
    }
}

function resolverRonda(ronda, ataquePropio, ataqueRival) {
    const resultado = resultadoAtaque(ataquePropio, ataqueRival)
    if (resultado > 0) {
        victoriasJugador++
        sectionMensajes.textContent = "¡Ganaste esta ronda!"
    } else if (resultado < 0) {
        victoriasEnemigo++
        sectionMensajes.textContent = "Tu rival ganó esta ronda."
    } else {
        sectionMensajes.textContent = "¡Los ataques fueron iguales!"
    }
    spanVidasMascota.textContent = victoriasJugador
    spanVidasEnemigo.textContent = victoriasEnemigo
    agregarAtaque(AtaquesJugador, ataquePropio, ronda)
    agregarAtaque(AtaquesEnemigo, ataqueRival, ronda)
}

function resultadoAtaque(jugador, enemigo) {
    if (jugador === enemigo) {
        return 0
    }
    const ganaContra = {
        FUEGO: ["TIERRA", "ORO"],
        AGUA: ["FUEGO"],
        TIERRA: ["AGUA"],
        ORO: ["AGUA", "TIERRA"]
    }
    return ganaContra[jugador].includes(enemigo) ? 1 : -1
}

function agregarAtaque(contenedor, ataque, ronda) {
    const texto = document.createElement("p")
    texto.textContent = `${ronda + 1}. ${ataque}`
    contenedor.appendChild(texto)
}

function mostrarResultadoFinal() {
    const resultado = victoriasJugador === victoriasEnemigo
        ? "¡La partida terminó en empate!"
        : victoriasJugador > victoriasEnemigo
            ? "¡Ganaste la partida!"
            : "Tu rival ganó la partida."
    sectionMensajes.textContent = resultado
    botonReinicio.style.display = "block"
    botonesAtaque.forEach((boton) => { boton.disabled = true })
}

function reiniciarJuego() {
    if (canalSala) {
        clienteSupabase.removeChannel(canalSala)
    }
    window.location.href = window.location.pathname
}

function aleatorio(minimo, maximo) {
    return Math.floor(Math.random() * (maximo - minimo + 1) + minimo)
}

function limitar(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, valor))
}

function crearId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function crearCodigoSala() {
    const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const aleatorios = new Uint8Array(8)
    window.crypto.getRandomValues(aleatorios)
    return Array.from(aleatorios, (numero) => letras[numero % letras.length]).join("")
}

function crearEnlaceSala() {
    const url = new URL(window.location.href)
    url.searchParams.set("room", codigoSala)
    return url.href
}

function copiarEnlace() {
    const campo = document.getElementById("enlace-sala")
    campo.select()
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(campo.value)
            .then(() => { estadoSala.textContent = "Enlace copiado. ¡Compártelo con tu rival!" })
            .catch((error) => mostrarError(`No se pudo copiar el enlace: ${error.message}`))
    } else {
        estadoSala.textContent = "Enlace seleccionado; cópialo para compartirlo con tu rival."
    }
}

function enviarEvento(evento) {
    if (!canalSala) {
        return Promise.reject(new Error("No hay una sala conectada."))
    }
    return canalSala.send({
        type: "broadcast",
        event: "game",
        payload: { ...evento, playerId: jugadorId }
    }).then((respuesta) => {
        if (respuesta !== "ok") {
            throw new Error(`Supabase respondió: ${respuesta}`)
        }
    })
}

function desactivarControlesSala(desactivados) {
    document.getElementById("crear-sala").disabled = desactivados
    document.getElementById("unirse-sala").disabled = desactivados
}

function mostrarErrorConfiguracion() {
    estadoSala.textContent = "Configura la URL y la clave pública de Supabase en supabase-config.js para jugar en línea. También puedes practicar sin conexión."
}

function mostrarError(mensaje) {
    console.error(mensaje)
    if (seccionAtaque.style.display !== "none") {
        sectionMensajes.textContent = mensaje
    } else if (seccionMapa.style.display !== "none") {
        estadoJuego.textContent = mensaje
    } else {
        estadoSala.textContent = mensaje
    }
    desactivarControlesSala(false)
}

function cerrarSalaConError(mensaje) {
    const canalAnterior = canalSala
    canalSala = null
    if (clienteSupabase && canalAnterior) {
        clienteSupabase.removeChannel(canalAnterior)
    }
    desactivarControlesSala(false)
    mostrarError(mensaje)
}

window.addEventListener("load", iniciarJuego)
