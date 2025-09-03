const PASSWORD = "lider2024";

function login() {
  const input = document.getElementById("admin-pass").value;
  const msg = document.getElementById("login-msg");

  if (input === PASSWORD) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
  } else {
    msg.innerText = "Contraseña incorrecta";
  }
}

let votacionID = null;

function crearVotacion() {
  const nombre = document.getElementById("nombre-votacion").value;
  if (!nombre) return alert("Poné un nombre");

  fetch('/admin/crear-votacion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre })
  })
  .then(res => res.json())
  .then(data => {
    votacionID = data.id;
    document.getElementById("candidatos-section").style.display = "block";
    alert("Votación creada");
    cargarCandidatos();
  })
  .catch(err => console.error(err));
}

function agregarCandidatos() {
  const textarea = document.getElementById("nombres-candidatos");
  const nombres = textarea.value
    .split("\n")                 // separar por salto de línea
    .map(n => n.trim())          // quitar espacios extra
    .filter(n => n.length > 0);  // quitar líneas vacías

  if (nombres.length === 0 || !votacionID) {
    alert("Por favor, escribe al menos un candidato.");
    return;
  }

  // Usamos Promise.all para esperar a que todos se guarden
  Promise.all(
    nombres.map(nombre =>
      fetch('/admin/agregar-candidato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, votacion_id: votacionID })
      }).then(res => res.json())
    )
  )
  .then(() => {
    textarea.value = "";
    cargarCandidatos(); // refresca lista y select
  })
  .catch(err => console.error("Error al agregar candidatos:", err));
}


function cargarCandidatos() {
  if (!votacionID) return;
  fetch(`/admin/candidatos/${votacionID}`)
    .then(res => res.json())
    .then(data => {
      const lista = document.getElementById("lista-candidatos");
      const select = document.getElementById("voto-manual-select");
      lista.innerHTML = "";
      select.innerHTML = "";
      data.forEach(c => {
        const li = document.createElement("li");
        li.textContent = c.nombre;
        lista.appendChild(li);

        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.nombre;
        select.appendChild(option);
      });
    });
}

function activarVotacion() {
  if (!votacionID) return;

  fetch('/admin/activar-votacion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ votacion_id: votacionID })
  })
  .then(res => res.json())
  .then(data => alert(data.mensaje))
  .catch(err => console.error(err));
}

function desactivarVotacion() {
  if (!votacionID) return;

  fetch('/admin/finalizar-votacion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ votacion_id: votacionID })
  })
  .then(res => res.json())
  .then(data => alert(data.mensaje))
  .catch(err => console.error(err));
}

function agregarVotoManual() {
  alert("Función de voto manual todavía no conectada");
}

function agregarVotoManual() {
  const select = document.getElementById("voto-manual-select");
  const candidato_id = select.value;
  const cantidad = parseInt(document.getElementById("cantidad-votos").value) || 1;

  if (!candidato_id) {
    alert("Selecciona un candidato");
    return;
  }
  if (cantidad < 1) {
    alert("La cantidad debe ser al menos 1");
    return;
  }

  fetch('/admin/voto-manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidato_id, cantidad })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.mensaje || 'Votos agregados');
  })
  .catch(err => {
    console.error(err);
    alert('Error al agregar voto');
  });
}