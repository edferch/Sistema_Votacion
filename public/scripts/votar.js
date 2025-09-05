let votacionID = null;

function generarUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const fingerprint = localStorage.getItem("fingerprint") || generarUUID();
localStorage.setItem("fingerprint", fingerprint);


fetch('/admin/votacion-activa')
  .then(res => res.json())
  .then(data => {
    const contenedor = document.getElementById("candidatos-container");
    const nombre = document.getElementById("nombre-votacion");

    if (!data) {
      nombre.textContent = "Votaciones AD Getsemaní, Dios te bendiga";
      return;
    }

    votacionID = data.votacion.id;
    nombre.textContent = data.votacion.nombre;

    data.candidatos.forEach(c => {
      const btn = document.createElement("button");
      btn.textContent = c.nombre;
      btn.onclick = () => votar(c.id);
      contenedor.appendChild(btn);
    });
  });

function votar(candidatoID) {
  const modal = document.getElementById("modal-confirmacion");
  const btnCancelar = document.getElementById("btn-cancelar");
  const btnConfirmar = document.getElementById("btn-confirmar");

  // Mostrar modal
  modal.style.display = "flex";

  // Cancelar
  btnCancelar.onclick = () => {
    modal.style.display = "none";
  };

  // Confirmar
  btnConfirmar.onclick = () => {
    modal.style.display = "none";

    // Aquí ya mandamos el voto
    fetch('/votar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        votacion_id: votacionID,
        candidato_id: candidatoID,
        fingerprint
      })
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById("mensaje").textContent = data.mensaje;
      document.getElementById("candidatos-container").innerHTML = "";
    })
    .catch(err => console.error(err));
  };
}
