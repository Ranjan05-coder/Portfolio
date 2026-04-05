require('dotenv').config();
const mongoose = require('mongoose');
const History = require('./models/History');
const Portfolio = require('./models/Portfolio');

async function checkHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log('📋 Checking history...\n');
    
    const history = await History.find().sort({ timestamp: -1 }).limit(50);
    
    if (history.length === 0) {
      console.log('⚠️ No history found');
    } else {
      console.log(`Found ${history.length} history entries:\n`);
      history.forEach((h, i) => {
        const date = new Date(h.timestamp).toLocaleString();
        console.log(`${i + 1}. ${h.action} - ${h.section} - ${date}`);
        if (h.description) console.log(`   Description: ${h.description}`);
      });
    }

    console.log('\n📊 Current Portfolio Data:');
    const portfolio = await Portfolio.findOne();
    if (portfolio) {
      console.log('✅ Portfolio exists');
      console.log(`   Projects: ${portfolio.projects?.length || 0}`);
      console.log(`   Skills: ${portfolio.skills?.length || 0}`);
      console.log(`   Experience: ${portfolio.experience?.length || 0}`);
      console.log(`   Certifications: ${portfolio.certifications?.length || 0}`);
      console.log(`   About: ${portfolio.about?.substring(0, 40) || 'empty'}...`);
    } else {
      console.log('❌ No portfolio found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkHistory();
