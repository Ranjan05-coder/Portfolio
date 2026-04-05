require('dotenv').config();
const mongoose = require('mongoose');
const History = require('./models/History');
const Portfolio = require('./models/Portfolio');

async function restoreFromHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log('🔍 Finding your original data...\n');
    
    // Find history entries from April 4th around 2:43 PM
    const targetDate = new Date('2026-04-04T14:43:06');
    const history = await History.find({
      timestamp: {
        $gte: new Date(targetDate.getTime() - 60000), // 1 minute before
        $lte: new Date(targetDate.getTime() + 60000)   // 1 minute after
      }
    }).sort({ timestamp: -1 });

    if (history.length === 0) {
      console.log('❌ Could not find your data in history');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`Found ${history.length} entries from your data entry time\n`);

    // Look for complete data in history
    let yourData = null;
    
    for (let entry of history) {
      if (entry.before && entry.before.projects) {
        yourData = entry.before;
        console.log('✅ Found your complete portfolio data!\n');
        break;
      }
    }

    if (!yourData) {
      console.log('❌ Could not extract complete data from history');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Display what we're restoring
    console.log('📊 Your data that will be restored:');
    console.log(`   Projects: ${yourData.projects?.length || 0}`);
    console.log(`   Skills: ${yourData.skills?.length || 0}`);
    console.log(`   Experience: ${yourData.experience?.length || 0}`);
    console.log(`   Certifications: ${yourData.certifications?.length || 0}`);
    console.log(`   About: ${yourData.about?.substring(0, 50) || 'empty'}...\n`);

    // Restore the data
    console.log('💾 Restoring your data to portfolio...\n');
    const restored = await Portfolio.findOneAndUpdate(
      {},
      yourData,
      { new: true }
    );

    console.log('✅ Successfully restored your portfolio!');
    console.log('   Projects:', restored.projects.length);
    console.log('   Skills:', restored.skills.length);
    console.log('   Experience:', restored.experience.length);
    console.log('   Certifications:', restored.certifications.length);

    await mongoose.connection.close();
    console.log('\n✓ Refresh your portfolio page to see the changes');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

restoreFromHistory();
