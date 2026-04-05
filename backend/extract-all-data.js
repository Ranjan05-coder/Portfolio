require('dotenv').config();
const mongoose = require('mongoose');
const Portfolio = require('./models/Portfolio');

async function extractAllData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log('📊 Extracting your complete portfolio data...\n');
    
    const portfolio = await Portfolio.findOne();
    
    if (!portfolio) {
      console.log('❌ No portfolio found');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Save to JSON file for reference
    const fs = require('fs');
    fs.writeFileSync('portfolio-backup.json', JSON.stringify(portfolio, null, 2));
    
    console.log('✅ Complete Portfolio Data:\n');
    console.log('════════════════════════════════════════');
    console.log('\n🦸 HERO:');
    console.log(JSON.stringify(portfolio.hero, null, 2));
    
    console.log('\n📝 ABOUT:');
    console.log(portfolio.about);
    
    console.log('\n🎯 SKILLS:');
    console.log(JSON.stringify(portfolio.skills, null, 2));
    
    console.log('\n📦 PROJECTS:');
    console.log(JSON.stringify(portfolio.projects, null, 2));
    
    console.log('\n💼 EXPERIENCE:');
    console.log(JSON.stringify(portfolio.experience, null, 2));
    
    console.log('\n🏆 CERTIFICATIONS:');
    console.log(JSON.stringify(portfolio.certifications, null, 2));
    
    console.log('\n🎓 EDUCATION:');
    console.log(JSON.stringify(portfolio.education, null, 2));
    
    console.log('\n📱 CONTACT:');
    console.log(JSON.stringify(portfolio.contact, null, 2));
    
    console.log('\n✅ Full data saved to portfolio-backup.json');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

extractAllData();
