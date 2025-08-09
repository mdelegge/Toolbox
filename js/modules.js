// modules.js — loading module metadata & data

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

async function loadManifest() {
  return fetchJSON('modules/manifest.json');
}

async function loadModuleByFile(file) {
  return fetchJSON(`modules/${file}`);
}

export { fetchJSON, loadManifest, loadModuleByFile };