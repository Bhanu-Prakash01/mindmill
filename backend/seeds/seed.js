/**
 * Mindmil Database Seeder
 *
 * ⚠️  DESTRUCTIVE: This script deletes ALL existing data before seeding.
 *     Only use for development/reset purposes.
 *
 * Usage: npm run seed
 *
 * Creates:
 *   - 3 Organizations (Demo, Global Talent, Peak Performance)
 *   - 10 Users (1 superadmin, 3 admins, 6 regular users)
 *   - DISC Personality Assessment (28 questions)
 *   - Big Five Personality Test (50 questions)
 *   - Cognitive Aptitude Test (3 questions)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/database');
const { User, Organization, Assessment, Question, Attempt } = require('../models');


const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB...\n');

    // ──────────────────────────────────────────────
    // 1. CLEAR ALL EXISTING DATA
    // ──────────────────────────────────────────────
    console.log('⚠️  CLEARING ALL EXISTING DATA...');
    await Attempt.deleteMany({});
    await Question.deleteMany({});
    await Assessment.deleteMany({});
    await User.deleteMany({});
    await Organization.deleteMany({});
    console.log('✅ All existing data deleted\n');


    // ──────────────────────────────────────────────
    // 3. CREATE USERS
    // ──────────────────────────────────────────────

    // SuperAdmin (no organization)
    const superAdmin = await User.create({
      email: 'super@admin.com',
      password: 'supperadmin',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      organization: null,
      isActive: true
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}
seedData();