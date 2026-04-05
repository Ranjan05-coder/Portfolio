require('dotenv').config();
const mongoose = require('mongoose');
const History = require('./models/History');

async function searchForProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log('🔍 Searching all history for "MoveIt" or "Heart Disease"...\n');
    
    const allHistory = await History.find().sort({ timestamp: -1 });
    
    let found = false;
    
    allHistory.forEach((entry, i) => {
      const beforeStr = JSON.stringify(entry.before || '');
      const afterStr = JSON.stringify(entry.after || '');
      
      if (beforeStr.includes('MoveIt') || beforeStr.includes('moveit') || 
          afterStr.includes('MoveIt') || afterStr.includes('moveit') ||
          beforeStr.includes('Heart') || afterStr.includes('Heart')) {
        found = true;
        console.log(`\n✅ FOUND at entry ${i + 1} (${new Date(entry.timestamp).toLocaleString()})`);
        console.log(`   Action: ${entry.action} - Section: ${entry.section}`);
        console.log(`   Before: ${JSON.stringify(entry.before).substring(0, 100)}`);
        console.log(`   After: ${JSON.stringify(entry.after).substring(0, 100)}`);
      }
    });

    if (!found) {
      console.log('❌ Could not find MoveIt or Heart Disease in history');
      console.log('\n📝 Checking what data IS in the database...');
      
      // Show projects with non-empty data
      allHistory.forEach((entry, i) => {
        if (entry.section === 'projects' && entry.after && Array.isArray(entry.after) && entry.after.length > 0) {
          console.log(`\nEntry ${i + 1}: ${new Date(entry.timestamp).toLocaleString()}`);
          console.log(JSON.stringify(entry.after, null, 2));
        }
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

searchForProjects();
