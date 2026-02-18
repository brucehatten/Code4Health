import fileReader from './FileReader.js';
import sourcingManager from './Find3DModel.js';
import Exhibit from './Exhibit.js';

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
            const scenesArray = await this.reader.processMedicalScene(file, this.sourcing);

            // Map the array of data into an array of Exhibit instances
            const newExhibits = scenesArray.map(data => {
                const ex = new Exhibit(data.condition, data.models, data.story);
                this.exhibits.push(ex); // Save to your history
                return ex;
            });

            return {
                success: true,
                count: newExhibits.length,
                exhibits: newExhibits
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Optional: Get all history to show a "Gallery" view on the frontend
    getGallery() {
        return this.exhibits;
    }
}

export default new BackendStructure();