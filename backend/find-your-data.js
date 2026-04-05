require('dotenv').config();
const mongoose = require('mongoose');
const History = require('./models/History');

async function findYourRealData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log('🔍 Searching for YOUR REAL data (before my mistake)...\n');
    
    // Get all history sorted by date
    const allHistory = await History.find().sort({ timestamp: 1 });
    
    console.log(`Found ${allHistory.length} history entries\n`);
    
    // Show unique sections that were modified
    const sections = new Set();
    allHistory.forEach(h => {
      if (h.section) sections.add(h.section);
    });
    
    console.log('📋 Sections with changes:');
    Array.from(sections).forEach(s => console.log(`   - ${s}`));
    
    console.log('\n📊 Timeline of changes:');
    allHistory.forEach((h, i) => {
      const date = new Date(h.timestamp).toLocaleString();
      const hasData = h.before || h.after;
      const dataSymbol = hasData ? '✅' : '⚠️';
      console.log(`${i + 1}. [${date}] ${dataSymbol} ${h.action} - ${h.section} - ${h.description || ''}`);
    });
    
    console.log('\n🎯 Looking for entries with YOUR projects...');
    const projectEntries = allHistory.filter(h => 
      h.section === 'projects' && h.before && Array.isArray(h.before)
    );
    
    if (projectEntries.length > 0) {
      console.log(`\nFound ${projectEntries.length} project history entries:\n`);
      projectEntries.forEach((entry, i) => {
        console.log(`Entry ${i + 1} (${new Date(entry.timestamp).toLocaleString()}):`);
        console.log(JSON.stringify(entry.before, null, 2));
        console.log('---');
      });
    } else {
      console.log('\n⚠️ No project history found in "before" state');
      console.log('Checking "after" state:');
      const projectAfter = allHistory.filter(h => 
        h.section === 'projects' && h.after && Array.isArray(h.after)
      );
      
      if (projectAfter.length > 0) {
        projectAfter.forEach((entry, i) => {
          console.log(`\nEntry ${i + 1} (${new Date(entry.timestamp).toLocaleString()}):`);
          console.log(JSON.stringify(entry.after, null, 2));
        });
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

findYourRealData();
