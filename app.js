// 1. CONFIGURACIÓN EXACTA DE TU FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCRJQFj_XDb9jgiVQPEBa5T64rIN8kRtew",
    authDomain: "motocargo-ddc1f.firebaseapp.com",
    projectId: "motocargo-ddc1f",
    storageBucket: "motocargo-ddc1f.firebasestorage.app",
    messagingSenderId: "1084568305914",
    appId: "1:1084568305914:web:47b61613e8e5533d738943",
    measurementId: "G-4VMFPKPJ5P"
};

// 2. INICIALIZAR FIREBASE
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ==========================================
// CONTROL DE ACCESO (LOGIN)
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("dashboard-screen").style.display = "block";
        
        // Cargamos todos los datos una vez que entramos
        cargarMetricas();
        cargarTablaKYC();
        cargarTablaPagos();
        //cargarTablaUsuarios();
         // 👇 AHORA LLAMAMOS A LAS DOS NUEVAS 👇
        cargarTablaClientes();
        cargarTablaConductores();
    } else {
        document.getElementById("login-screen").style.display = "flex";
        document.getElementById("dashboard-screen").style.display = "none";
    }
});

function iniciarSesion() {
    const email = document.getElementById("admin-email").value;
    const pass = document.getElementById("admin-pass").value;
    auth.signInWithEmailAndPassword(email, pass).catch((error) => {
        document.getElementById("login-error").style.display = "block";
        document.getElementById("login-error").innerText = "Credenciales incorrectas.";
    });
}

function cerrarSesion() { 
    auth.signOut(); 
}

// ==========================================
// CONTROL DE MENÚ Y NAVEGACIÓN
// ==========================================
function toggleMenu() { 
    document.getElementById("sidebar").classList.toggle("show"); 
}

function cambiarVista(vista) {
    // Ocultar todas las vistas y mostrar la seleccionada
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    const vistaElement = document.getElementById('view-' + vista);
    if(vistaElement) vistaElement.classList.add('active');

    // Cambiar color del menú lateral
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const navElement = document.getElementById('nav-' + vista);
    if(navElement) navElement.classList.add('active');

    // Ocultar menú en celular
    if(window.innerWidth <= 768) {
        document.getElementById("sidebar").classList.remove("show");
    }

   // Recargar datos por seguridad
    if (vista === 'inicio') cargarMetricas();
    if (vista === 'kyc') cargarTablaKYC();
    if (vista === 'pagos') cargarTablaPagos();
    if (vista === 'clientes') cargarTablaClientes();       // <--- NUEVO
    if (vista === 'conductores') cargarTablaConductores(); // <--- NUEVO
    if (vista === 'tarifas') cargarConfiguracionPais();
    if (vista === 'historial') cargarModuloHistorial(); // <--- AGREGA ESTA LÍNEA AQUÍ
}
// Función para ir a Usuarios y encender la pestaña a la fuerza
function abrirUsuariosTab(tipo) {
    // 1. Cambiamos a la pantalla de usuarios
    cambiarVista('usuarios');
    
    // 2. Apagamos ambas pestañas y tablas por seguridad
    document.getElementById('pills-clientes-tab').classList.remove('active');
    document.getElementById('pills-conductores-tab').classList.remove('active');
    document.getElementById('pills-clientes').classList.remove('show', 'active');
    document.getElementById('pills-conductores').classList.remove('show', 'active');

    // 3. Encendemos únicamente la que el usuario pidió
    if (tipo === 'conductores') {
        document.getElementById('pills-conductores-tab').classList.add('active');
        document.getElementById('pills-conductores').classList.add('show', 'active');
    } else if (tipo === 'clientes') {
        document.getElementById('pills-clientes-tab').classList.add('active');
        document.getElementById('pills-clientes').classList.add('show', 'active');
    }
}

// ==========================================
// FUNCIONES DE BASE DE DATOS (BLINDADAS)
// ==========================================

function cargarMetricas() {
    // 1. Contar Total de Conductores
    db.collection("Drivers").get().then((querySnapshot) => {
        const elConductores = document.getElementById("total-conductores");
        if(elConductores) elConductores.innerText = querySnapshot.size;
    }).catch(error => console.error("Error al cargar conductores:", error));

    // 2. Contar Total de Clientes
    db.collection("Clients").get().then((querySnapshot) => {
        const elClientes = document.getElementById("total-clientes");
        if(elClientes) elClientes.innerText = querySnapshot.size;
    }).catch(error => console.error("Error al cargar clientes:", error));

    // 👇 3. NUEVO: Contar Total de Viajes Realizados 👇
    db.collection("Histories").get().then((querySnapshot) => {
        const elViajes = document.getElementById("total-viajes");
        if(elViajes) elViajes.innerText = querySnapshot.size;
    }).catch(error => console.error("Error al cargar viajes:", error));
}

function cargarTablaKYC() {
    db.collection("Drivers").where("estadoVerificacion", "==", "Pendiente").get().then((querySnapshot) => {
        // Escudo: Buscamos cualquier ID que hayas usado en tu HTML
        const tabla = document.getElementById("tabla-kyc") || document.getElementById("tabla-pendientes");
        if(!tabla) return; 

        tabla.innerHTML = ""; 

        if(querySnapshot.empty) {
            tabla.innerHTML = "<tr><td colspan='5' class='text-center text-muted'>Todo al día. No hay cuentas por aprobar.</td></tr>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const driver = doc.data();
            tabla.innerHTML += `
                <tr>
                    <td><strong>${driver.name || ''} ${driver.lastname || ''}</strong><br><small class="text-muted">${driver.phone || ''}</small></td>
                    <td>${driver.cedula || ''}</td>
                    <td>${driver.tipo || ''} <br><small>(${driver.plateNumber || ''})</small></td>
                    <td><span class="badge bg-warning text-dark">Pendiente</span></td>
                    <td><button class="btn btn-sm btn-primary" onclick="abrirVerificacion('${doc.id}')">Revisar Fotos</button></td>
                </tr>
            `;
        });
    });
}

function cargarTablaPagos() {
    db.collection("PagosSuscripcion").orderBy("timestamp", "desc").limit(50).get().then((querySnapshot) => {
        const tabla = document.getElementById("tabla-pagos");
        if(!tabla) return;

        tabla.innerHTML = ""; 

        if(querySnapshot.empty) {
            tabla.innerHTML = "<tr><td colspan='5' class='text-center text-muted'>Aún no hay pagos registrados.</td></tr>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const pago = doc.data();
            tabla.innerHTML += `
                <tr>
                    <td>${pago.fechaTransaccion || ''}</td>
                    <td><strong class="text-success">${pago.referencia || ''}</strong></td>
                    <td>${pago.telefonoOrigen || ''} <br><small class="text-muted">C.I: ${pago.cedulaOrigen || ''}</small></td>
                    <td>${pago.montoBs || '0'} Bs.</td>
                    <td><span class="badge bg-dark">${pago.plan || ''}</span></td>
                </tr>
            `;
        });
    }).catch(error => {
        console.error("Error al cargar pagos:", error);
    });
}

// ==========================================
// MÓDULOS DE CLIENTES Y CONDUCTORES
// ==========================================

function cargarTablaClientes() {
    db.collection("Clients").get().then((querySnapshot) => {
        const tablaClientes = document.getElementById("tabla-clientes-only");
        if (!tablaClientes) return; 

        if (querySnapshot.empty) {
            tablaClientes.innerHTML = "<tr><td colspan='4' class='text-center text-muted py-4'>No hay clientes registrados.</td></tr>";
        } else {
            let htmlClientes = "";
            querySnapshot.forEach((doc) => {
                const client = doc.data();
                const billetera = (client.billetera || 0).toFixed(2); 
                
                htmlClientes += `
                    <tr>
                        <td>
                            <strong>${client.name || 'Sin nombre'} ${client.lastname || ''}</strong><br>
                            <small class="text-muted d-md-none">${client.phone || ''}</small> <!-- Aparece en móviles -->
                        </td>
                        <td class="d-none d-md-table-cell">
                            ${client.email || 'Sin correo'}<br>
                            <small class="text-muted">${client.phone || 'Sin teléfono'}</small>
                        </td>
                        <td class="text-success fw-bold">${billetera} $</td>
                        <td>
                            <button class="btn btn-sm btn-danger" onclick="eliminarUsuario('Clients', '${doc.id}')" title="Eliminar">
                                <span class="material-icons" style="font-size: 18px; vertical-align: middle;">delete</span>
                            </button>
                        </td>
                    </tr>
                `;
            });
            tablaClientes.innerHTML = htmlClientes;
        }
    });
}

function cargarTablaConductores() {
    db.collection("Drivers").get().then((querySnapshot) => {
        const tablaConductores = document.getElementById("tabla-conductores-only");
        if (!tablaConductores) return;

        if (querySnapshot.empty) {
            tablaConductores.innerHTML = "<tr><td colspan='5' class='text-center text-muted py-4'>No hay conductores registrados.</td></tr>";
        } else {
            let htmlConductores = "";
            querySnapshot.forEach((doc) => {
                const driver = doc.data();
                
                let estadoColor = "bg-secondary";
                const estado = driver.estadoVerificacion || "No Verificado";
                if(estado === "Aprobado") estadoColor = "bg-success";
                if(estado === "Pendiente") estadoColor = "bg-warning text-dark";
                if(estado === "No Verificado") estadoColor = "bg-danger";

                // Botones apilados (Flex column) para que no se desborden en celular
                let btnActivar = driver.activado === true 
                    ? `<button class="btn btn-sm btn-outline-danger w-100 mb-1" onclick="cambiarEstadoConductor('${doc.id}', false)">Bloquear</button>`
                    : `<button class="btn btn-sm btn-outline-success w-100 mb-1" onclick="cambiarEstadoConductor('${doc.id}', true)">Activar</button>`;

                const foto = driver.image ? driver.image : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                const planTexto = (driver.planSuscripcion && driver.planSuscripcion !== "Ninguno") 
                    ? `<strong class="text-dark">${driver.planSuscripcion}</strong><br><small class="text-muted">Vence: ${driver.fechaVencimiento || 'N/A'}</small>` 
                    : `<span class="text-muted">Sin plan</span>`;

                htmlConductores += `
                    <tr>
                        <td style="min-width: 200px;">
                            <div class="d-flex align-items-center">
                                <img src="${foto}" alt="Foto" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; margin-right: 12px; border: 2px solid #EF6339; flex-shrink: 0;">
                                <div>
                                    <strong>${driver.name || ''} ${driver.lastname || ''}</strong><br>
                                    <small class="text-muted">C.I: ${driver.cedula || 'N/A'} | ${driver.phone || ''}</small>
                                </div>
                            </div>
                        </td>
                        <td class="d-none d-lg-table-cell">${driver.tipo || 'N/A'}<br><small class="text-muted">${driver.brandCar || ''} ${driver.colorCar || ''}</small></td>
                        <td class="d-none d-md-table-cell">${planTexto}</td>
                        <td>
                            <div class="d-flex flex-column gap-1 align-items-start">
                                <span class="badge ${estadoColor}">${estado}</span>
                                <span class="badge ${driver.activado ? 'bg-primary' : 'bg-secondary'}">${driver.activado ? 'App Activa' : 'App Bloqueada'}</span>
                            </div>
                        </td>
                        <td style="min-width: 100px;">
                            <div class="d-flex flex-column">

                                <!-- 👇 NUEVO BOTÓN DE DETALLES 👇 -->
                                <button class="btn btn-sm btn-info text-white w-100 mb-1 fw-bold" onclick="abrirDetallesConductor('${doc.id}')">Ver Detalles</button>

                                ${btnActivar}
                                <button class="btn btn-sm btn-danger w-100" onclick="eliminarUsuario('Drivers', '${doc.id}')">
                                    <span class="material-icons" style="font-size: 16px; vertical-align: middle;">delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tablaConductores.innerHTML = htmlConductores;
        }
    });
}

// ==========================================
// MÓDULO DE HISTORIAL DE VIAJES
// ==========================================
let diccionarioConductores = {}; // Para recordar los nombres sin hacer doble consulta

// ==========================================
// MOTOR DE BÚSQUEDA EN TIEMPO REAL
// ==========================================

// 1. Buscador Universal para Tablas (Oculta las filas que no coinciden)
function filtrarTabla(inputId, tablaId) {
    const input = document.getElementById(inputId).value.toLowerCase();
    const filas = document.getElementById(tablaId).getElementsByTagName("tr");

    for (let i = 0; i < filas.length; i++) {
        // Ignoramos la fila que dice "Cargando..."
        if (filas[i].cells.length === 1) continue; 

        // Escaneamos todo el texto de la fila (Nombre, Placa, Cédula, etc)
        const textoFila = filas[i].textContent || filas[i].innerText;
        
        if (textoFila.toLowerCase().indexOf(input) > -1) {
            filas[i].style.display = ""; // Lo muestra
        } else {
            filas[i].style.display = "none"; // Lo oculta instantáneamente
        }
    }
}

// 2. Memoria Caché para el selector del Historial
let opcionesConductoresCache = []; 

// 👇 REEMPLAZA TU FUNCIÓN 'cargarModuloHistorial()' POR ESTA NUEVA VERSIÓN 👇
function cargarModuloHistorial() {
    db.collection("Drivers").get().then((querySnapshot) => {
        opcionesConductoresCache = []; // Limpiamos la caché
        
        querySnapshot.forEach((doc) => {
            const d = doc.data();
            const nombre = `${d.name || ''} ${d.lastname || ''}`;
            diccionarioConductores[doc.id] = nombre; 
            
            // Guardamos el conductor en la memoria secreta
            opcionesConductoresCache.push({
                html: `<option value="${doc.id}">${nombre} (C.I: ${d.cedula || 'N/A'})</option>`,
                textoBusqueda: nombre.toLowerCase() + " " + (d.cedula || "")
            });
        });
        
        // Pintamos la lista completa la primera vez
        renderizarSelectHistorial(""); 
        cargarTablaHistorial("TODOS");
    });
}

// 3. Pinta la lista desplegable dependiendo de lo que el usuario escriba
function renderizarSelectHistorial(filtroText) {
    const select = document.getElementById("select-filtro-conductor");
    let htmlFinal = '<option value="TODOS">Todos los viajes (Global)</option>';
    
    opcionesConductoresCache.forEach(op => {
        if (op.textoBusqueda.includes(filtroText.toLowerCase())) {
            htmlFinal += op.html;
        }
    });
    select.innerHTML = htmlFinal;
}

// 4. Se ejecuta cada vez que presionas una tecla en el buscador del historial
function filtrarOpcionesHistorial() {
    const texto = document.getElementById("busqueda-historial").value;
    renderizarSelectHistorial(texto);
}

// Se ejecuta cada vez que cambias el menú desplegable
function filtrarHistorial() {
    const idConductorSeleccionado = document.getElementById("select-filtro-conductor").value;
    cargarTablaHistorial(idConductorSeleccionado);
}

function cargarTablaHistorial(idFiltro) {
    const tabla = document.getElementById("tabla-historial");
    tabla.innerHTML = "<tr><td colspan='5' class='text-center py-4'>Buscando viajes...</td></tr>";

    // Preparamos la consulta
    let consulta = db.collection("Histories").orderBy("timestamp", "desc").limit(50);
    
    // Si seleccionó un conductor específico, filtramos por él
    if (idFiltro !== "TODOS") {
        consulta = db.collection("Histories")
            .where("idDriver", "==", idFiltro)
            .orderBy("timestamp", "desc")
            .limit(100);
    }

    consulta.get().then((querySnapshot) => {
        // Actualizamos el número gigante de servicios prestados
        document.getElementById("contador-viajes").innerText = querySnapshot.size;

        if (querySnapshot.empty) {
            tabla.innerHTML = "<tr><td colspan='5' class='text-center text-muted py-4'>No se encontraron viajes registrados.</td></tr>";
            return;
        }

      let html = "";
        querySnapshot.forEach((doc) => {
            const history = doc.data();
            
            // Calculamos la fecha legible
            const fechaViaje = new Date(history.timestamp).toLocaleString();
            // Buscamos el nombre del conductor
            const nombreConductor = diccionarioConductores[history.idDriver] || "Conductor Desconocido";
            // Precios y Km
            const precio = history.price ? history.price.toFixed(2) : "0.00";
            const km = history.km ? history.km.toFixed(1) : "0.0";
            // Estrellas
            const estrellas = history.calificationToDriver || "Sin calificar";

            // 👇 TABLA CON CÓDIGO RESPONSIVE 👇
            html += `
                <tr>
                    <td>
                        <strong>${fechaViaje}</strong><br>
                        <small style="color: #EF6339;">Por: ${nombreConductor}</small>
                    </td>
                    <td style="min-width: 200px;">
                        <small class="text-success fw-bold">A:</small> <small>${history.origin || 'N/A'}</small><br>
                        <small class="text-danger fw-bold">B:</small> <small>${history.destination || 'N/A'}</small>
                    </td>
                    <!-- Esta columna desaparece en celulares -->
                    <td class="d-none d-lg-table-cell">
                        ${km} km <br><small class="text-muted">${history.time || 0} min</small>
                    </td>
                    <td class="fw-bold text-success">
                        ${precio} $
                        <!-- En celular, mostramos la estrella aquí abajo para no perder la información -->
                        <div class="d-md-none text-dark small mt-1">⭐ ${estrellas}</div>
                    </td>
                    <!-- Esta columna desaparece en celulares -->
                    <td class="d-none d-md-table-cell">
                        <span class="badge bg-dark">⭐ ${estrellas}</span>
                    </td>
                </tr>
            `;
        });
        tabla.innerHTML = html;

    }).catch(error => {
        console.error("Error al cargar historial:", error);
        tabla.innerHTML = "<tr><td colspan='5' class='text-center text-danger py-4 fw-bold'>⚠️ Abre la consola (F12) y haz clic en el enlace para crear el Índice de Firebase.</td></tr>";
    });
}

function cambiarEstadoConductor(id, nuevoEstado) {
    const accionTexto = nuevoEstado ? "Activar" : "Bloquear";
    const icono = nuevoEstado ? "question" : "warning";

    Swal.fire({
        title: `¿Deseas ${accionTexto} a este conductor?`,
        text: nuevoEstado ? "El conductor podrá recibir viajes inmediatamente." : "El conductor será desconectado y no podrá trabajar.",
        icon: icono,
        showCancelButton: true,
        confirmButtonColor: '#EF6339', // Naranja MotoCarGO
        cancelButtonColor: '#1A1A1A',  // Negro elegante
        confirmButtonText: `Sí, ${accionTexto}`,
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            db.collection("Drivers").doc(id).update({ activado: nuevoEstado }).then(() => {
                Swal.fire({
                    title: '¡Hecho!',
                    text: `El conductor ha sido ${nuevoEstado ? 'activado' : 'bloqueado'} con éxito.`,
                    icon: 'success',
                    confirmButtonColor: '#EF6339'
                });
                cargarTablaConductores(); 
            }).catch((error) => {
                console.error("Error al actualizar:", error);
                Swal.fire('Error', 'Hubo un problema de conexión con la base de datos.', 'error');
            });
        }
    });
}

function eliminarUsuario(coleccion, id) {
    Swal.fire({
        title: '¿Estás 100% seguro?',
        text: "¡No podrás revertir esto! El usuario y todos sus datos se borrarán para siempre.",
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#d33', // Rojo peligro
        cancelButtonColor: '#1A1A1A',
        confirmButtonText: 'Sí, ELIMINAR',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            db.collection(coleccion).doc(id).delete().then(() => {
                Swal.fire({
                    title: '¡Eliminado!',
                    text: 'El usuario ha sido borrado del sistema.',
                    icon: 'success',
                    confirmButtonColor: '#EF6339'
                });
                cargarTablaClientes(); 
                cargarTablaConductores(); 
                cargarMetricas(); 
            }).catch((error) => {
                console.error("Error eliminando:", error);
                Swal.fire('Error', 'No se pudo eliminar al usuario.', 'error');
            });
        }
    });
}

function abrirVerificacion(driverId) {
    alert("Próximamente: Se abrirá una ventana para revisar la Selfie y la Cédula del conductor con ID: " + driverId);
}
// ==========================================
// MÓDULO DE CONFIGURACIÓN DE TARIFAS (CRUD)
// ==========================================

// 2. Cargar Tarifas de Viaje y Configuración
// 2. Cargar Tarifas de Viaje y Configuración
function cargarConfiguracionPais() {
    const pais = document.getElementById("select-pais").value;
    
    // Cargar Planes de Suscripción
    db.collection("Config").doc("planes_" + pais).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById("plan-moneda").value = data.moneda || "";
            document.getElementById("plan-mensual").value = data.mensual || "";
            document.getElementById("plan-anual").value = data.anual || "";
            document.getElementById("plan-vitalicio").value = data.vitalicio || "";
        } else {
            // Si el país no tiene planes aún, dejamos los campos vacíos
            document.getElementById("plan-moneda").value = "";
            document.getElementById("plan-mensual").value = "";
            document.getElementById("plan-anual").value = "";
            document.getElementById("plan-vitalicio").value = "";
        }
    }).catch(err => console.log("Aún no hay planes para este país"));

    // 👇 CORRECCIÓN AQUÍ: AHORA SIEMPRE BUSCARÁ prices_VE, prices_CO, etc. 👇
    let docPricesId = "prices_" + pais;

    db.collection("Config").doc(docPricesId).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            // Respetamos las mayúsculas exactas
            document.getElementById("tarifa-moto-corta").value = data.CcortaMoto || "";
            document.getElementById("tarifa-carro-corta").value = data.CcortaCarro || "";
            document.getElementById("tarifa-moto-media").value = data.CmediaMoto || "";
            document.getElementById("tarifa-carro-media").value = data.CMediaCarro || ""; 
            document.getElementById("tarifa-moto-larga").value = data.CLargaMoto || "";
            document.getElementById("tarifa-carro-larga").value = data.CLargaCarro || "";
            document.getElementById("tarifa-moto-km").value = data.kmMoto || "";
            document.getElementById("tarifa-carro-km").value = data.kmCarro || "";
            document.getElementById("tarifa-tasa").value = data.taza || ""; 
            
            // Leemos la palabra Delivery / Encomienda
            document.getElementById("config-nombre-delivery").value = data.nombreDelivery || "Delivery";
        } else {
            // Limpiar si no existe
            document.querySelectorAll('#view-tarifas input').forEach(input => {
                if(!input.id.includes('plan') && input.id !== 'select-pais') input.value = "";
            });
        }
    }).catch(err => console.log("Aún no hay tarifas para este país"));
}

// GUARDAR LOS PRECIOS
function guardarPrecios() {
    const pais = document.getElementById("select-pais").value;
    let docPricesId = pais === "VE" ? "prices" : "prices_" + pais;

    const data = {
        CcortaMoto: parseFloat(document.getElementById("tarifa-moto-corta").value) || 0,
        CcortaCarro: parseFloat(document.getElementById("tarifa-carro-corta").value) || 0,
        CmediaMoto: parseFloat(document.getElementById("tarifa-moto-media").value) || 0,
        CMediaCarro: parseFloat(document.getElementById("tarifa-carro-media").value) || 0,
        CLargaMoto: parseFloat(document.getElementById("tarifa-moto-larga").value) || 0,
        CLargaCarro: parseFloat(document.getElementById("tarifa-carro-larga").value) || 0,
        kmMoto: parseFloat(document.getElementById("tarifa-moto-km").value) || 0,
        kmCarro: parseFloat(document.getElementById("tarifa-carro-km").value) || 0,
        taza: parseFloat(document.getElementById("tarifa-tasa").value) || 0,
        nombreDelivery: document.getElementById("config-nombre-delivery").value || "Delivery"
    };

    db.collection("Config").doc(docPricesId).set(data, { merge: true }).then(() => {
        Swal.fire('¡Éxito!', `Tarifas y configuración actualizadas para ${pais}`, 'success');
    }).catch(err => {
        console.error(err);
        Swal.fire('Error', 'Ocurrió un problema al guardar las tarifas.', 'error');
    });
}

function guardarPlanes() {
    const pais = document.getElementById("select-pais").value;
    const moneda = document.getElementById("plan-moneda").value;
    const mensual = parseFloat(document.getElementById("plan-mensual").value);
    const anual = parseFloat(document.getElementById("plan-anual").value);
    const vitalicio = parseFloat(document.getElementById("plan-vitalicio").value);

    if(!moneda || isNaN(mensual)) {
        Swal.fire('Faltan Datos', 'Completa al menos el símbolo de moneda y el plan mensual.', 'warning');
        return;
    }

    db.collection("Config").doc("planes_" + pais).set({
        moneda: moneda,
        mensual: mensual,
        anual: isNaN(anual) ? 0 : anual,
        vitalicio: isNaN(vitalicio) ? 0 : vitalicio
    }, { merge: true }).then(() => {
        Swal.fire('¡Éxito!', `Planes de suscripción actualizados para ${pais}`, 'success');
    }).catch(err => {
        console.error(err);
        Swal.fire('Error', 'Ocurrió un problema al guardar los planes.', 'error');
    });
}

// ==========================================
// FUNCIÓN PARA VER FICHA COMPLETA DEL CONDUCTOR
// ==========================================
function abrirDetallesConductor(idDriver) {
    db.collection("Drivers").doc(idDriver).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();

            // 1. Datos Personales
            document.getElementById("det-nombre").innerText = `${data.name || ''} ${data.lastname || ''}`;
            document.getElementById("det-id-firebase").innerText = `ID Firebase: ${data.id || idDriver}`;
            document.getElementById("det-cedula").innerText = data.cedula || "No registrada";
            document.getElementById("det-phone").innerText = data.phone || "No registrado";
            document.getElementById("det-email").innerText = data.email || "No registrado";

            // 2. Datos del Vehículo
            document.getElementById("det-tipo").innerText = data.tipo || "N/A";
            document.getElementById("det-marca").innerText = data.brandCar || "N/A";
            document.getElementById("det-color").innerText = data.colorCar || "N/A";
            document.getElementById("det-placa").innerText = data.plateNumber || "N/A";

            // 3. Finanzas y Estado
            const billetera = (data.billetera || 0).toFixed(2);
            document.getElementById("det-billetera").innerText = `${billetera} $`;
            document.getElementById("det-plan").innerText = data.planSuscripcion || "Ninguno";
            
            const fechaInicio = data.fechaInicioSuscripcion || "--/--/----";
            const fechaFin = data.fechaVencimiento || "--/--/----";
            document.getElementById("det-fechas").innerText = `${fechaInicio} al ${fechaFin}`;

            // Estatus con colores
            const estadoSpan = document.getElementById("det-estado");
            estadoSpan.innerText = `${data.estadoVerificacion || "No Verificado"} | ${data.activado ? 'App Activa' : 'App Bloqueada'}`;
            estadoSpan.className = `badge ${data.estadoVerificacion === "Aprobado" ? "bg-success" : "bg-danger"}`;

            // 4. Documentos y Fotos (Con validación por si están vacíos)
            const defaultImg = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            const defaultDoc = "https://placehold.co/300x200?text=Documento+No+Subido";

            document.getElementById("det-img-perfil").src = data.image || defaultImg;
            
            document.getElementById("det-img-cedula").src = data.urlCedula || defaultDoc;
            document.getElementById("link-cedula").href = data.urlCedula || "#";

            document.getElementById("det-img-registro").src = data.urlRegistroCivil || defaultDoc;
            document.getElementById("link-registro").href = data.urlRegistroCivil || "#";

            // 5. ¡Abre la ventana flotante mágicamente!
            var myModal = new bootstrap.Modal(document.getElementById('modalDetallesConductor'));
            myModal.show();

        } else {
            alert("No se encontró la información del conductor.");
        }
    }).catch((error) => {
        console.error("Error obteniendo detalles:", error);
        alert("Error de conexión al cargar los detalles.");
    });
}
