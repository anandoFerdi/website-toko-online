const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/BITESHIP_API_KEY=(.+)/);
const originMatch = env.match(/BITESHIP_ORIGIN_AREA_ID=(.+)/);
if (!keyMatch || !originMatch) {
  console.log("Missing key or origin");
  process.exit(1);
}
const key = keyMatch[1].trim();
const originId = originMatch[1].trim().replace(/\"/g, '');

console.log("Using API Key:", key.substring(0, 5) + "...");
console.log("Using Origin Area ID:", originId);

fetch('https://api.biteship.com/v1/rates/couriers', {
  method: 'POST',
  headers: {
    'Authorization': key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    origin_area_id: originId,
    destination_area_id: 'IDNP11IDNC111IDND716IDZ59416', // Example destination
    couriers: 'jne',
    items: [{ name: 'test', value: 1000, weight: 1000, quantity: 1 }]
  })
})
.then(r => r.json())
.then(r => console.log(JSON.stringify(r, null, 2)))
.catch(console.error);
