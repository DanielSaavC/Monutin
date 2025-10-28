import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("🔑 Claves generadas:\n", keys);
