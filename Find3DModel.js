import { ApifyClient } from 'apify-client';
import 'dotenv/config';


class ModelSourcingManager {
    constructor(apifyToken, sketchfabToken) {
        this.client = new ApifyClient({ token: apifyToken });
        this.sketchfabToken = sketchfabToken;
        this.currentModel = null;
    }

    // Finds the UID via AI Search
    async search(query) {
        const input = { 
            "useAI": true, 
            "naturalQuery": query, 
            "downloadable": true, 
            "count": 1,
            "file_format": "gltf" 
        };

        const run = await this.client.actor("N3hdEyWDox8xXpahn").call(input);
        const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

        // The first item (index 0) is just the search metadata we saw in your log.
        // The actual models start from index 1 onwards.
        if (items.length > 1) {
            return items[1]; // This should be the first actual model object
        } else if (items.length === 1 && items[0].uid) {
            // Fallback in case the Actor behavior changes
            return items[0];
        }
        
        return null;
    }

    // Gets the link and metadata
    async getDownloadLink(query) {
        const model = await this.search(query);
        if (!model) throw new Error("No model found in the dataset.");

        // The Actor might name this 'uuid' or 'uid' depending on the version
        const uid = model.uid || model.uuid || model.id; 
        const name = model.name || model.title || "Unknown Model";

        console.log(`Found: ${name} (UID: ${uid})`);

        if (!uid) {
            console.error("The search result didn't contain a UID. Here is the data we got:", model);
            return null;
        }

        const response = await fetch(`https://api.sketchfab.com/v3/models/${uid}/download`, {
            headers: { 'Authorization': `Token ${this.sketchfabToken}` }
        });

        const result = await response.json();

        if (result.detail) {
            console.error("Sketchfab API Error:", result.detail);
            return null;
        }

        this.currentModel = {
            url: result.glb?.url || result.gltf?.url || null,
            name: name,
            isZip: !result.glb
        };

        return this.currentModel;
    }

    
}

// USAGE
const sourcing = new ModelSourcingManager(
    process.env.APIFY_TOKEN, 
    process.env.SKETCHFAB_TOKEN
);
// Trigger this when the user inputs a medical condition
sourcing.getDownloadLink("Human heart")
    .then(data => console.log("Spawn this model:", data.url))
    .catch(err => console.error(err));