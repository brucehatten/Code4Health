import fs from 'fs/promises';
import pdf from 'pdf-parse';

class FileReader {
    constructor() {
        this.supportedTypes = ['text/plain', 'application/pdf'];
    }

    // Main method to read any supported file
    async extractText(file) {
        if (!file) throw new Error("No file provided.");

        if (file.mimetype === 'application/pdf') {
            return await this._readPDF(file.path);
        } else if (file.mimetype === 'text/plain') {
            return await this._readText(file.path);
        } else {
            throw new Error(`Unsupported file type: ${file.mimetype}`);
        }
    }

    async _readText(path) {
        return await fs.readFile(path, 'utf-8');
    }

    async _readPDF(path) {
        const dataBuffer = await fs.readFile(path);
        const data = await pdf(dataBuffer);
        return data.text;
    }

    cleanText(text) {
        return text.replace(/\s+/g, ' ').trim();
    }

    async askAIWithContext(context) {
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const prompt = `
            SYSTEM INSTRUCTION: You are a medical mnemonic specialist and storyteller. 
            Your task is to identify the 3 most important medical concepts in the text below.
            1. Assign a "Memory Prop" (a physical 3D object) to each concept.
            2. Write a very short "Fairy Tale" story (2-3 sentences) linking them together.

            RULES:
            1. The props must be physical objects.
            2. Format the output strictly as: (Title, prop1, prop2, prop3, story)
            3. Do not use commas inside the story (use semicolons).
            4. Do not include any other text.

            --- MEDICAL TEXT ---
            ${context}
        `;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.candidates[0].content.parts[0].text;
    }

    async askAi(file) {
        const rawText = await this.extractText(file);
        const context = this.cleanText(rawText);
        return await this.askAIWithContext(context);
    }

    async processMedicalScene(file, sourcingManager) {
        try {
            const rawString = await this.askAi(file);
            
            // Parsing: (Title, p1, p2, p3, story)
            const items = rawString.replace(/[()]/g, '').split(',').map(item => item.trim());

            const title = items[0];
            const propNames = [items[1], items[2], items[3]];
            const story = items[4]; // The Fairy Tale

            // Only search for the 3 props, not the title or story
            const modelPromises = propNames.map(name => sourcingManager.getDownloadLink(name));
            const modelResults = await Promise.all(modelPromises);

            return {
                condition: title,
                story: story,
                models: modelResults.filter(m => m !== null)
            };

        } catch (error) {
            console.error("Error building scene:", error);
        }
    }
}

export default new FileReader();