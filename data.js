// seed.js

import mongoose from "mongoose";
import Place from "./models/placeModel.js";
import Article from "./models/articleModel.js" // Adjust the path based on your actual file structure

// Connect to MongoDB

// Dummy data for places
const dummyPlaces = [
    {
        name: 'Beautiful Park',
        location: { latitude: 40.7128, longitude: -74.0060 },
        city: 'New York',
        region: 'est',  // Adjusted to a valid enum value
        tags: ['park', 'nature'],
        photos: [],
        liked_by_users: [],
        profil_picture: '',
        profil_url: '',
        album: []
    },
    {
        name: 'Historical Museum',
        location: { latitude: 34.0522, longitude: -118.2437 },
        city: 'Los Angeles',
        region: 'ouest',  // Adjusted to a valid enum value
        tags: ['museum', 'history'],
        photos: [],
        liked_by_users: [],
        profil_picture: '',
        profil_url: '',
        album: []
    },
    // Add more dummy places as needed
];
const dummyArticles = [
    {
        "title": "Constantine: The City of Bridges",
        "content": "A captivating journey through the ancient city of Constantine and its iconic bridges.",
        "author_name": "David Anderson",
        "publication_date": "2023-11-12T00:00:00.000Z",
        "place_id": "6550e64cbfb2c03a90a93e75",
        "likes": []
    },
    {
        "title": "Constantine: The City of Bridges",
        "content": "A captivating journey through the ancient city of Constantine and its iconic bridges.",
        "author_name": "David Anderson",
        "publication_date": "2023-11-12T00:00:00.000Z",
        "place_id": "6550e64cbfb2c03a90a93e75", // Replace with the ObjectId of the Constantine place
        "likes": []
    },
    {
        "title": "Exploring Constantine's Historical Sites",
        "content": "Uncovering the rich history and cultural heritage of Constantine's historical landmarks.",
        "author_name": "Sophia Garcia",
        "publication_date": "2023-11-12T00:00:00.000Z",
        "place_id": "6550e64cbfb2c03a90a93e75", // Replace with the ObjectId of the Constantine place
        "likes": []
    }
    // Add more dummy articles related to Constantine as needed
];




// Function to insert dummy places
const insertDummyPlaces = async () => {
    try {
        const savedPlaces = await Place.insertMany(dummyPlaces);
        console.log("Dummy places saved:", savedPlaces);
    } catch (error) {
        console.error("Error saving dummy places:", error);
    } finally {
        // Close the MongoDB connection after inserting dummy data
        mongoose.connection.close();
    }
};

const insertDummyArticles = async () => {
    try {
        const savedArticles = await Article.insertMany(dummyArticles);
        console.log("Dummy articles saved:", savedArticles);
    } catch (error) {
        console.error("Error saving dummy articles:", error);
    } finally {
        // Close the MongoDB connection after inserting dummy data
        mongoose.connection.close();
    }
};


// Call the function to insert dummy places
export  { insertDummyPlaces , insertDummyArticles} ;
