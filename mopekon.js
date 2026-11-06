//IniciarJuego
const seccionAtaque = document.getElementById("seleccionar-ataque")
const OcultarReinicio = document.getElementById("boton-reinicio")
const botonMascotaJugador = document.getElementById('boton-mascota')
const botonReinicio = document.getElementById("boton-reinicio")
const contenedorTarjetas = document.getElementById("Contenedor-Tarjetas")
//seleccionarMascotaJugador
const seccionMascota = document.getElementById("seleccionar-mascota")  
const Imagen = new Image (80);
document.querySelector("#Ataques-Jugador").appendChild(Imagen);
//seleccionarMascotaEnemigo
const EImagen = new Image (80);
document.querySelector("#Ataques-Enemigo").appendChild(EImagen);
//Combate
const spanVidasMascota = document.getElementById("vidas-mascota")
const spanVidasEnemigo = document.getElementById("vidas-enemigo")
const contenedorAtaques = document.getElementById("contenedor-Ataques")
//CrearMensaje
const sectionMensajes = document.getElementById('Resultado')
const AtaquesJugador = document.getElementById('Ataques-Jugador')
const AtaquesEnemigo = document.getElementById('Ataques-Enemigo')
//Mapa
const seccionMapa = document.getElementById("MAPA")
const nuestroMapa = document.getElementById("BUSCA")
const Botn = document.getElementById("Movimiento")
const Imapa = new Image ();
Imapa.src = "./Material/Mapa.jpg"
const MaxACH = 800

let Slimes = []
let enemigos = []
let ataqueEnemigo = []
let ataqueJugador = []
let indexAtaqueJugador
let indexAtaqueEnemigo
let mascotaJugador
let mascotaJugadorObj
let ataquesSlimeEnemigo
let botonesA = []
let VictoriasJugador = 0
let VictoriasEnemigo = 0
const Lienzo = nuestroMapa.getContext("2d")
let intervalo 
const ACHMapa = Math.max(240, Math.min(MaxACH - 20, window.innerWidth - 20))
const ALTMapa = ACHMapa / 2
let combateActivo = false
nuestroMapa.width = ACHMapa
nuestroMapa.height = ALTMapa

class Slime {
    constructor(nombre, foto, vida){
        this.nombre = nombre
        this.foto = foto
        this.vida = vida
        this.ataques = []
        this.ancho = ACHMapa * 40 / 400
        this.alto = ALTMapa * 40 / 200
        this.x = aleatorio(0, nuestroMapa.width - this.ancho)
        this.y = aleatorio(0, nuestroMapa.height - this.alto)
        this.velocidadX = 0
        this.velocidadY = 0
        this.mapaFoto = new Image()
        this.mapaFoto.src = foto
    }
    pintarSlime(){
        Lienzo.drawImage(
            this.mapaFoto,
            this.x,
            this.y,
            this.ancho,
            this.alto 
        )
    }
}

let Fuego = new Slime("Fuego", "./Material/Fuego.jpeg", 3) 
let Charco = new Slime("Charco", "./Material/Charco.jpeg", 3) 
let Maraña = new Slime("Maraña", "./Material/Maraña.jpeg", 3) 
let Dorado = new Slime("Dorado", "./Material/Gold_Slime.jpeg", 6) 

const FuegoAtaq = [    
    {nombre: "FUEGO"},
    {nombre: "AGUA"},
    {nombre: "FUEGO"},
    {nombre: "TIERRA"},
    {nombre: "FUEGO"}
]
Fuego.ataques.push(...FuegoAtaq)

const CharcoAtaq = [    
    {nombre: "AGUA"},
    {nombre: "FUEGO"},
    {nombre: "AGUA"},
    {nombre: "TIERRA"},
    {nombre: "AGUA"}
]
Charco.ataques.push(...CharcoAtaq)

const MarañaAtaq = [
    {nombre: "TIERRA"},
    {nombre: "AGUA"},
    {nombre: "TIERRA"},
    {nombre: "FUEGO"},
    {nombre: "TIERRA"}
]
Maraña.ataques.push(...MarañaAtaq)

const DoradoAtaq = [
    {nombre: "ORO"},
    {nombre: "AGUA"},
    {nombre: "FUEGO"},
    {nombre: "TIERRA"},
    {nombre: "AGUA"}
]
Dorado.ataques.push(...DoradoAtaq)  
    
Slimes.push(Fuego, Charco, Maraña, Dorado)

function iniciarJuego() {
//ocultar 
    seccionAtaque.style.display = "none"
    seccionMapa.style.display = "none"
//Slimes
    Slimes.forEach((slime) => {
    const opcionDeSlimes = `
    <input type="radio" name="mascota" id=${slime.nombre} />
    <label class="tarjetaSlime" for=${slime.nombre}>
        <p><strong>${slime.nombre}</strong></p>
        <img src=${slime.foto} alt=${slime.nombre}>
    </label>
    `
    contenedorTarjetas.innerHTML += opcionDeSlimes
    })
//Ocultar Reinicio
    OcultarReinicio.style.display = "none"
//Mascota
    botonMascotaJugador.addEventListener('click', seleccionarMascotaJugador)
//reinicio
    botonReinicio.addEventListener("click", reiniciarJuego)
}
function seleccionarMascotaJugador() {
    const seleccion = document.querySelector('input[name="mascota"]:checked')
    if (!seleccion) {
        alert("Selecciona un slime antes de continuar")
        return
    }

    botonMascotaJugador.disabled = true
    seccionMascota.style.display = "none"
    mascotaJugador = seleccion.id
    Imagen.src = Slimes.find((slime) => slime.nombre === mascotaJugador).foto
    extaerAtaques(mascotaJugador)
    seccionMapa.style.display = "flex"
    Botn.style.display = "flex"
    IniciarMapa()
}
function pintarCanvas(){
    mascotaJugadorObj.x = mascotaJugadorObj.x + mascotaJugadorObj.velocidadX
    mascotaJugadorObj.y = mascotaJugadorObj.y + mascotaJugadorObj.velocidadY
    mascotaJugadorObj.x = Math.max(0, Math.min(nuestroMapa.width - mascotaJugadorObj.ancho, mascotaJugadorObj.x))
    mascotaJugadorObj.y = Math.max(0, Math.min(nuestroMapa.height - mascotaJugadorObj.alto, mascotaJugadorObj.y))
    Lienzo.clearRect(0, 0, nuestroMapa.width, nuestroMapa.height)
    if (Imapa.complete && Imapa.naturalWidth) {
        Lienzo.drawImage(Imapa, 0, 0, nuestroMapa.width, nuestroMapa.height)
    }
    enemigos.forEach((enemigo) => enemigo.pintarSlime())
    mascotaJugadorObj.pintarSlime()
    if (mascotaJugadorObj.velocidadX !== 0 || mascotaJugadorObj.velocidadY !== 0) {
        for (const enemigo of enemigos) {
            revisarColision(enemigo)
            if (combateActivo) {
                break
            }
        }
    }
}
function SlimeM(){
    return Slimes.find((slime) => mascotaJugador === slime.nombre)
}
function moverSlimeD(){
    mascotaJugadorObj.velocidadX = 5
}
function moverSlimeI(){
    mascotaJugadorObj.velocidadX = -5 
}
function moverSlimeA(){
    mascotaJugadorObj.velocidadY = 5 
}
function moverSlimeAB(){
    mascotaJugadorObj.velocidadY = -5 

}
function Teclas(event){
    switch (event.key) {
        case "w":
            moverSlimeAB()
            break;
        case "ArrowUp":
            moverSlimeAB()
            break;
        case "s":
            moverSlimeA()
            break;
        case "ArrowDown":
            moverSlimeA()
            break;
        case "a":
            moverSlimeI()
            break;
        case "ArrowLeft":
            moverSlimeI()
            break;
        case "d":
            moverSlimeD()
            break; 
        case "ArrowRight":
            moverSlimeD()   
            break;           
        default:
            break;
    }
}
function detenerSlime(){
    mascotaJugadorObj.velocidadX = 0
    mascotaJugadorObj.velocidadY = 0
}

function extaerAtaques(){
    mostrarAtaques(SlimeM().ataques)
}

function mostrarAtaques(ataques){
    ataques.forEach((ataque) => {
        const botonAtaque = `
        <button class="Botones-de-Fuego BAtaque"><strong>${ataque.nombre}</strong></button>
        `
        contenedorAtaques.innerHTML += botonAtaque
    })
    botonesA = document.querySelectorAll(".BAtaque")
    secuenciaAtaque()
}

function secuenciaAtaque(){
    botonesA.forEach((boton) =>{
        boton.addEventListener("click", (e) => {
            const ataque = e.currentTarget.textContent.trim()
            ataqueJugador.push(ataque)
            boton.style.background = "#BBBFCA"
            boton.disabled = true
            ataqueAleatorioEnemigo()
        })
    })
}

function seleccionarMascotaEnemigo(enemigo) {
    combateActivo = true
    EImagen.src = enemigo.foto
    ataquesSlimeEnemigo = enemigo.ataques
    ataqueJugador = []
    ataqueEnemigo = []
    AtaquesJugador.querySelectorAll("p").forEach((ataque) => ataque.remove())
    AtaquesEnemigo.querySelectorAll("p").forEach((ataque) => ataque.remove())
    spanVidasMascota.textContent = "0"
    spanVidasEnemigo.textContent = "0"
    contenedorAtaques.innerHTML = ""
    mostrarAtaques(SlimeM().ataques)
}

function ataqueAleatorioEnemigo() {
    const ataqueAleatorio = aleatorio(0, ataquesSlimeEnemigo.length - 1)
    ataqueEnemigo.push(ataquesSlimeEnemigo[ataqueAleatorio].nombre)
    inciarPelea()
}

function inciarPelea(){
    if (ataqueJugador.length === 5) {
        combate()
    }
}

function indexAmbosOponentes(jugador, enemigo){
    indexAtaqueJugador = ataqueJugador[jugador]
    indexAtaqueEnemigo = ataqueEnemigo[enemigo]
}

function combate() {
    for (let index = 0; index < ataqueJugador.length; index++) {
        indexAmbosOponentes(index, index)
        const resultado = resultadoAtaque(indexAtaqueJugador, indexAtaqueEnemigo)
        if (resultado === 0) {
            crearMensaje("VAYA, SON IGUALES!")
        } else if (resultado > 0) {
            crearMensaje("GANASTE ESTA RONDA!")
            VictoriasJugador++
            spanVidasMascota.textContent = VictoriasJugador
        }else {
            crearMensaje("OH NO, TU ENEMIGO TE VENCIO!")
            VictoriasEnemigo++
            spanVidasEnemigo.textContent = VictoriasEnemigo
        }
    }
    revisarTablas()
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

function revisarTablas() {
    if (VictoriasJugador === VictoriasEnemigo){
        crearMensajeFinal("ESTO FUE ALGO INESPERADO, EMPATE")
    }else if (VictoriasJugador > VictoriasEnemigo){
        crearMensajeFinal("PERFECTO, ERES MUY FUERTE!")
    }else {
        crearMensajeFinal("YA LO SUPONIA, ERES DEBIL!")
    }
    botonesA.forEach((boton) => { boton.disabled = true })
}

function crearMensaje(resultado) {
 
    let NuevoAtaqueJugador = document.createElement('p')
    let NuevoAtaqueEnemigo = document.createElement('p')

    sectionMensajes.innerHTML = resultado
    NuevoAtaqueJugador.innerHTML = indexAtaqueJugador
    NuevoAtaqueEnemigo.innerHTML = indexAtaqueEnemigo

    AtaquesJugador.appendChild(NuevoAtaqueJugador)
    AtaquesEnemigo.appendChild(NuevoAtaqueEnemigo)
}

function crearMensajeFinal(resultadoFinal) {
    OcultarReinicio.style.display = "block"
    sectionMensajes.innerHTML = resultadoFinal
}

function reiniciarJuego(){
    location.reload()
}

function aleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}
function IniciarMapa(){
    mascotaJugadorObj = SlimeM(mascotaJugador)
    enemigos = Slimes
        .filter((slime) => slime.nombre !== mascotaJugador)
        .map((slime, index, lista) => {
            const enemigo = new Slime(slime.nombre, slime.foto, slime.vida)
            enemigo.ataques = slime.ataques
            enemigo.x = (index + 1) * nuestroMapa.width / (lista.length + 1) - enemigo.ancho / 2
            enemigo.y = index % 2 === 0 ? 20 : nuestroMapa.height - enemigo.alto - 20
            return enemigo
        })
    intervalo = setInterval(pintarCanvas, 50)
    window.addEventListener('keydown', Teclas)
    window.addEventListener("keyup", detenerSlime)
}
function revisarColision(enemigo){
    const seSeparan = mascotaJugadorObj.x + mascotaJugadorObj.ancho < enemigo.x ||
        mascotaJugadorObj.x > enemigo.x + enemigo.ancho ||
        mascotaJugadorObj.y + mascotaJugadorObj.alto < enemigo.y ||
        mascotaJugadorObj.y > enemigo.y + enemigo.alto
    if (seSeparan || combateActivo) {
        return 
    }
    detenerSlime()
    clearInterval(intervalo)
    console.log("Se detecto una colision")
    seccionAtaque.style.display = "flex"
    seccionMapa.style.display = "none"
    Botn.style.display = "none"
    seleccionarMascotaEnemigo(enemigo)
}
window.addEventListener('load', iniciarJuego)