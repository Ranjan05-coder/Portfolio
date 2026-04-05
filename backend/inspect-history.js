require('dotenv').config();
const mongoose = require('mongoose');
const History = require('./models/History');

async function inspectHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log('📋 Inspecting history detail...\n');
    
    const history = await History.find().sort({ timestamp: -1 }).limit(5);
    
    history.forEach((h, i) => {
      console.log(`\n${i + 1}. ${h.action} - ${h.section}`);
      console.log(`   Before keys: ${h.before ? Object.keys(h.before).join(', ') : 'none'}`);
      console.log(`   After keys: ${h.after ? Object.keys(h.after).join(', ') : 'none'}`);
      if (h.before && h.before.projects) {
        console.log(`   ✅ HAS PROJECTS in before: ${h.before.projects.length}`);
      }
      if (h.after && h.after.projects) {
        console.log(`   ✅ HAS PROJECTS in after: ${h.after.projects.length}`);
      }
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

inspectHistory();
