require('dotenv').config();
const mongoose = require('mongoose');
const History = require('./models/History');

async function getYourProjectData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log('🎯 Extracting YOUR projects from 4/4/2026, 2:43:06 PM...\n');
    
    const targetDate = new Date('2026-04-04T14:43:06');
    
    const entry = await History.findOne({
      section: 'projects',
      timestamp: {
        $gte: new Date(targetDate.getTime() - 5000),
        $lte: new Date(targetDate.getTime() + 5000)
      }
    });

    if (!entry) {
      console.log('❌ Could not find exact entry');
      process.exit(1);
    }

    console.log('✅ FOUND YOUR PROJECTS DATA:\n');
    console.log('BEFORE STATE (what was there before you changed it):');
    console.log(JSON.stringify(entry.before, null, 2));
    
    console.log('\n\nAFTER STATE (what you changed it TO - YOUR DATA):');
    console.log(JSON.stringify(entry.after, null, 2));

    // Also get other sections from that same timestamp
    console.log('\n\n====== OTHER DATA FROM SAME TIME ======\n');
    
    const heroEntry = await History.findOne({
      section: 'hero',
      timestamp: targetDate
    });
    if (heroEntry && heroEntry.after) {
      console.log('🦸 YOUR HERO DATA:');
      console.log(JSON.stringify(heroEntry.after, null, 2));
    }

    const skillsEntry = await History.findOne({
      section: 'skills',
      timestamp: targetDate
    });
    if (skillsEntry && skillsEntry.after) {
      console.log('\n🎯 YOUR SKILLS:');
      console.log(JSON.stringify(skillsEntry.after, null, 2));
    }

    const certEntry = await History.findOne({
      section: 'certifications',
      timestamp: targetDate
    });
    if (certEntry && certEntry.after) {
      console.log('\n🏆 YOUR CERTIFICATIONS:');
      console.log(JSON.stringify(certEntry.after, null, 2));
    }

    const educationEntry = await History.findOne({
      section: 'education',
      timestamp: targetDate
    });
    if (educationEntry && educationEntry.after) {
      console.log('\n🎓 YOUR EDUCATION:');
      console.log(JSON.stringify(educationEntry.after, null, 2));
    }

    const expEntry = await History.findOne({
      section: 'experience',
      timestamp: targetDate
    });
    if (expEntry && expEntry.after) {
      console.log('\n💼 YOUR EXPERIENCE:');
      console.log(JSON.stringify(expEntry.after, null, 2));
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getYourProjectData();
