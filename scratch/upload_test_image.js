require('dotenv').config({ path: '../backend/.env' });
const fs = require('fs');
const { uploadFile } = require('../backend/services/cloudinaryUploadService');
const mongoose = require('mongoose');

async function upload() {
  try {
    const buffer = fs.readFileSync('/home/azad/.gemini/antigravity/brain/353b4eb3-404c-4603-836c-fd4ff142d5cd/logical_3x3_pattern_1779902052124.png');
    const result = await uploadFile(buffer, { folder: 'mindmill/question-images/' });
    console.log("Uploaded successfully:", result.url);
  } catch (error) {
    console.error("Error:", error);
  }
}
upload();
