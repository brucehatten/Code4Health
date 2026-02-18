class Exhibit {
    constructor(title, models, story) {
        this.title = title;    // "The Kingdom of Insulin"
        this.models = models;  // Array of 3D model data
        this.story = story;    // The fairy tale string
        this.timestamp = Date.now();
    }

    // You can add helper methods here
    getSummary() {
        return `${this.title}: ${this.story.substring(0, 50)}...`;
    }
}

export default new Exhibit();