/**
 * MedLab 3D — Proxy Server
 * Handles Apify + Sketchfab API calls server-side (bypasses browser CORS).
 *
 * Run:  node server.js
 * Then open:  http://localhost:3000
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { ApifyClient } = require('apify-client');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// ── CONFIG ────────────────────────────────────────────────────────────────────
const APIFY_TOKEN = 'apify_api_C7106vkfqnIYd7vzjdhcuyMPJ4CPyd0wY0tl';
const SKETCHFAB_TOKEN = '417dc58517b4449aa0f15348fc16ae2a';
const APIFY_ACTOR = 'N3hdEyWDox8xXpahn';
const PORT = 3000;

const apify = new ApifyClient({ token: APIFY_TOKEN });

// ── ROUTE: search Sketchfab via Apify ─────────────────────────────────────────
app.post('/api/search', async (req, res) => {
  const query = req.body.query || '';
  console.log(`[search] "${query}"`);

  try {
    const input = {
      useAI: false,
      naturalQuery: '',
      cursor: '',
      count: 5,
      q: query,
      tags: [],
      categories: [],
      downloadable: true,
      pbr_type: '',
      file_format: '',
      license: '',
      sort_by: 'likes',
    };

    const run = await apify.actor(APIFY_ACTOR).call(input, { waitSecs: 120 });
    const { items } = await apify.dataset(run.defaultDatasetId).listItems();

    console.log(`[search] "${query}" → ${items.length} items`);
    if (items.length) console.log('[search] first item keys:', Object.keys(items[0]));

    if (!items.length) return res.json({ uid: null, name: query });

    const item = items.find(i => i.uid || i.modelId || i.id || i.viewerUrl) || items[0];
    let uid = item.uid || item.modelId || item.id || null;
    const name = item.name || item.title || item.modelName || query;

    if (!uid && item.viewerUrl) {
      const m = item.viewerUrl.match(/models\/([a-f0-9]+)/i);
      if (m) uid = m[1];
    }
    if (!uid && item.url) {
      const m = String(item.url).match(/([a-f0-9]{32})/i);
      if (m) uid = m[1];
    }

    console.log(`[search] "${query}" → uid=${uid} name="${name}"`);
    res.json({ uid, name, viewerUrl: uid ? `https://sketchfab.com/models/${uid}/embed` : null });

  } catch (err) {
    console.error(`[search] ERROR "${query}":`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ROUTE: get Sketchfab GLTF download URL ────────────────────────────────────
app.get('/api/download/:uid', async (req, res) => {
  const { uid } = req.params;
  console.log(`[download] uid=${uid}`);

  try {
    const sfRes = await fetch(`https://api.sketchfab.com/v3/models/${uid}/download`, {
      headers: { Authorization: `Token ${SKETCHFAB_TOKEN}` }
    });

    if (!sfRes.ok) {
      const txt = await sfRes.text();
      console.error(`[download] Sketchfab ${sfRes.status}:`, txt.slice(0, 200));
      return res.status(sfRes.status).json({ error: `Sketchfab ${sfRes.status}: ${txt.slice(0, 100)}` });
    }

    const data = await sfRes.json();
    console.log('[download] Sketchfab response keys:', Object.keys(data));

    const fmt = data.gltf || data.glb || data.source || data.usdz || null;
    let url = fmt?.url || null;

    if (!url) {
      for (const val of Object.values(data)) {
        if (val && typeof val === 'object' && val.url) { url = val.url; break; }
      }
    }

    if (!url) {
      console.error('[download] No URL in response:', JSON.stringify(data).slice(0, 300));
      return res.status(404).json({ error: 'No download URL in Sketchfab response', data });
    }

    console.log(`[download] url=${url.slice(0, 80)}…`);
    res.json({ url });

  } catch (err) {
    console.error('[download] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ROUTE: download, unzip, and serve the GLTF file ──────────────────────────
// Sketchfab serves models as zip archives containing scene.gltf + bin + textures
// GLTFLoader can't load zips — we unzip server-side and serve the files directly
app.get('/api/proxy', async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send('Missing url param');

  console.log(`[proxy] fetching ${target.slice(0, 80)}…`);

  try {
    const response = await fetch(target);
    if (!response.ok) return res.status(response.status).send(`Upstream ${response.status}`);

    const contentType = response.headers.get('content-type') || '';
    const buffer = Buffer.from(await response.arrayBuffer());

    // Check if it's a zip (magic bytes PK)
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B;
    console.log(`[proxy] content-type=${contentType} size=${buffer.length} isZip=${isZip}`);

    if (isZip) {
      // Extract zip and serve the gltf file with correct paths
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      console.log('[proxy] zip contents:', entries.map(e => e.entryName).join(', '));

      // Find the main gltf or glb file
      const gltfEntry = entries.find(e => e.entryName.endsWith('.gltf'));
      const glbEntry = entries.find(e => e.entryName.endsWith('.glb'));

      if (glbEntry) {
        // GLB is self-contained — serve directly
        console.log(`[proxy] serving GLB: ${glbEntry.entryName}`);
        res.setHeader('Content-Type', 'model/gltf-binary');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(glbEntry.getData());

      } else if (gltfEntry) {
        // GLTF references external bin/texture files — store in temp dir and serve
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'medlab-'));
        zip.extractAllTo(tmpDir, true);

        const gltfPath = path.join(tmpDir, gltfEntry.entryName);
        console.log(`[proxy] serving GLTF from temp: ${gltfPath}`);

        // Serve the gltf file; bin/textures served via /api/asset route
        // Rewrite the gltf so bin/texture URIs point to our asset route
        let gltfText = fs.readFileSync(gltfPath, 'utf8');
        const gltfJson = JSON.parse(gltfText);

        // Rewrite buffer URIs to go through /api/asset
        if (gltfJson.buffers) {
          gltfJson.buffers.forEach(buf => {
            if (buf.uri && !buf.uri.startsWith('data:')) {
              const assetPath = path.join(path.dirname(gltfPath), buf.uri);
              const encoded = encodeURIComponent(assetPath);
              buf.uri = `/api/asset?file=${encoded}`;
            }
          });
        }
        // Rewrite image URIs
        if (gltfJson.images) {
          gltfJson.images.forEach(img => {
            if (img.uri && !img.uri.startsWith('data:')) {
              const assetPath = path.join(path.dirname(gltfPath), img.uri);
              const encoded = encodeURIComponent(assetPath);
              img.uri = `/api/asset?file=${encoded}`;
            }
          });
        }

        res.setHeader('Content-Type', 'model/gltf+json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(JSON.stringify(gltfJson));

      } else {
        res.status(404).send('No .gltf or .glb found in zip');
      }

    } else {
      // Not a zip — serve raw (GLB or plain gltf)
      res.setHeader('Content-Type', contentType || 'model/gltf-binary');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(buffer);
    }

  } catch (err) {
    console.error('[proxy] ERROR:', err.message);
    res.status(500).send(err.message);
  }
});

// ── ROUTE: serve extracted asset files (bin, textures) ───────────────────────
app.get('/api/asset', (req, res) => {
  const filePath = req.query.file;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('Asset not found');
  }
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    '.bin': 'application/octet-stream',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ktx2': 'image/ktx2',
    '.webp': 'image/webp',
  };
  res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  fs.createReadStream(filePath).pipe(res);
});

app.listen(PORT, () => {
  console.log(`\n✅ MedLab proxy running at http://localhost:${PORT}\n`);
});

