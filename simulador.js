import fetch from "node-fetch";

function generarDato() {
  return {
    device: "Incubadora_Test",
    temperatura: 35 + Math.random() * 5, // entre 35 y 40 °C
    humedad: 30 + Math.random() * 20,    // entre 30 y 50 %
    ambtemp: 36 + Math.random(),
    objtemp: 36 + Math.random() * 2,
    peso: 3.0 + Math.random() * 0.5
  };
}

setInterval(async () => {
  const data = generarDato();
  const res = await fetch("https://monutinbackend.onrender.com/api/sensores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  console.log(`📡 Enviado: T=${data.temperatura.toFixed(2)}°C H=${data.humedad.toFixed(1)}%`);
}, 10000); // cada 10 segundos
