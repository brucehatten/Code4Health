# Code4Health — MedLab 3D

A medical education tool that converts uploaded medical documents into interactive 3D exhibits using AI and Sketchfab models.

## Project Structure

```
Code4Health/
├── public/                        # Static frontend files (served by Express)
│   ├── index.html                 # 3D walking person prototype
│   └── 3d-lab-simulation.html     # Full lab simulation UI
├── src/
│   ├── backend/                   # Server entry point & coordination
│   │   ├── server.js              # Express server (run this to start)
│   │   └── BackendStructure.js    # Orchestrates file → AI → 3D pipeline
│   ├── models/                    # Data class definitions
│   │   └── Exhibit.js             # Exhibit blueprint (title, models, story)
│   └── services/                  # External API integrations
│       ├── FileReader.js          # PDF/text extraction + Gemini AI calls
│       └── Find3DModel.js         # Sketchfab model search via Apify
├── package.json
└── README.md
```

## Getting Started

### Install dependencies
```bash
npm install
```

### Start the server
```bash
npm start
# or: node src/backend/server.js
```

Then open **http://localhost:3000** in your browser.

## Environment Variables

Create a `.env` file in the project root:
```
APIFY_TOKEN=your_apify_token
SKETCHFAB_TOKEN=your_sketchfab_token
GEMINI_API_KEY=your_gemini_api_key
```