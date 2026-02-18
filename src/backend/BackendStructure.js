import fileReader from '../services/FileReader.js';
import sourcingManager from '../services/Find3DModel.js';
import Exhibit from '../models/Exhibit.js';

class BackendStructure {
    constructor() {
        this.sourcing = sourcingManager;
        this.reader = fileReader;
        this.exhibits = []; // Stores all exhibits generated in this session
    }

    /**
     * The Main Entry Point: 
     * Handles file -> AI -> 3D Models -> Exhibit Object
     */
    async createNewExhibit(file) {
        try {
            console.log("Starting generation for new medical exhibit...");

            // 1. Process the file and get raw data (Title, props, story) from Gemini
            const sceneData = await this.reader.processMedicalScene(file, this.sourcing);

            if (!sceneData) {
                throw new Error("AI failed to return valid scene data.");
            }

            // 2. Instantiate the Blueprint (One class, many objects)
            const newExhibit = new Exhibit(
                sceneData.condition,
                sceneData.models,
                sceneData.story
            );

            // 3. Store it in our local "Gallery"
            this.exhibits.push(newExhibit);

            console.log(`Successfully created exhibit: ${newExhibit.title}`);

            // 4. Return the object for the frontend to render
            return {
                success: true,
                data: newExhibit
            };

        } catch (error) {
            console.error("Backend coordination failed:", error);
            return { success: false, error: error.message };
        }
    }

    // Optional: Get all history to show a "Gallery" view on the frontend
    getGallery() {
        return this.exhibits;
    }
}

export default new BackendStructure();