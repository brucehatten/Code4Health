import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with API token
const client = new ApifyClient({
    token: '<YOUR_API_TOKEN>',
});

// Prepare Actor input
const input = {
    "useAI": true,
    "naturalQuery": "",
    "cursor": "",
    "count": 24,
    "q": "",
    "tags": [],
    "categories": [],
    "downloadable": true,
    "pbr_type": "",
    "file_format": "",
    "license": "",
    "sort_by": ""
};

(async () => {
    // Run the Actor and wait for it to finish
    const run = await client.actor("N3hdEyWDox8xXpahn").call(input);

    // Fetch and print Actor results from the run's dataset (if any)
    console.log('Results from dataset');
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    items.forEach((item) => {
        console.dir(item);
    });
})();