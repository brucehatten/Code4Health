import fs from 'fs/promises';
import pdf from 'pdf-parse';

class FileReader{

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

    // Private method for TXT files
    async _readText(path) {
        return await fs.readFile(path, 'utf-8');
    }

    // Private method for PDF files
    async _readPDF(path) {
        const dataBuffer = await fs.readFile(path);
        const data = await pdf(dataBuffer);
        return data.text; // Returns the full text from the PDF
    }

    // Helper to clean up the text (remove extra whitespace)
    cleanText(text) {
        return text.replace(/\s+/g, ' ').trim();
    }

    sendAI() {
        
    }
}

export default new MedicalFileReader();
