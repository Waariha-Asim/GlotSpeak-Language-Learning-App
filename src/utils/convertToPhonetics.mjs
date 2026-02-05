// convertToPhonetics.mjs - ES Module Version
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 Starting conversion...");
console.log("Current directory:", __dirname);

// Step A: Load your word list
try {
  // Go up 2 levels from utils to project root, then to data
  const wordListPath = path.join(__dirname, '../data/pronunciationWords.json');
  console.log("Looking for word list at:", wordListPath);
  
  const wordListContent = fs.readFileSync(wordListPath, 'utf8');
  const yourWords = JSON.parse(wordListContent);
  console.log(`📚 Loaded ${yourWords.length} words from your list`);
  
  // Step B: Load CMU dictionary
  // Assuming cmudict-0.7b.txt is in project root or data folder
  let cmuPath = path.join(__dirname, '../../cmudict-0.7b.txt');
  
  // Try different locations
  if (!fs.existsSync(cmuPath)) {
    cmuPath = path.join(__dirname, '../data/cmudict-0.7b.txt');
  }
  if (!fs.existsSync(cmuPath)) {
    cmuPath = path.join(__dirname, '../../../../cmudict-0.7b.txt');
  }
  
  console.log("Looking for CMU dict at:", cmuPath);
  
  if (!fs.existsSync(cmuPath)) {
    console.error("❌ CMU dictionary not found. Please make sure cmudict-0.7b.txt is in:");
    console.log("   - Project root folder (same as package.json)");
    console.log("   - OR in src/data/ folder");
    console.log("\nCurrent directory structure:");
    console.log(__dirname);
    process.exit(1);
  }
  
  const cmuContent = fs.readFileSync(cmuPath, 'utf8');
  console.log("📖 Loaded CMU dictionary");
  
  // Step C: Create lookup dictionary
  console.log("🔄 Creating pronunciation lookup...");
  const pronunciationMap = {};
  
  const lines = cmuContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim() && !line.startsWith(';;;')) {
      const parts = line.split('  '); // Two spaces between word and pronunciation
      if (parts.length >= 2) {
        const word = parts[0];
        const phonetics = parts.slice(1).join('  ');
        pronunciationMap[word.toLowerCase()] = phonetics;
      }
    }
    
    // Progress update every 5000 lines
    if (i > 0 && i % 5000 === 0) {
      console.log(`   Processed ${i} lines...`);
    }
  }
  
  console.log(`✅ Created map with ${Object.keys(pronunciationMap).length} pronunciations`);
  
  // Step D: Match your words
  console.log("\n🎯 Matching your words...");
  let foundCount = 0;
  let notFoundWords = [];
  
  const enhancedWords = yourWords.map(word => {
    const cleanWord = word.trim();
    const phonetic = pronunciationMap[cleanWord.toLowerCase()] || 
                     pronunciationMap[cleanWord.toUpperCase()];
    
    if (phonetic) {
      foundCount++;
    } else {
      notFoundWords.push(cleanWord);
    }
    
    return {
      word: cleanWord,
      phonetic: phonetic || 'NOT_FOUND',
      found: !!phonetic
    };
  });
  
  // Step E: Save results
  const outputPath = path.join(__dirname, '../data/enhancedWords.json');
  fs.writeFileSync(outputPath, JSON.stringify(enhancedWords, null, 2));
  
  console.log("\n📊 RESULTS:");
  console.log(`✅ Found pronunciations: ${foundCount} words`);
  console.log(`❌ Not found: ${notFoundWords.length} words`);
  
  if (notFoundWords.length > 0) {
    console.log("\n❌ Words not found in dictionary:");
    console.log(notFoundWords.slice(0, 10).join(', '));
    if (notFoundWords.length > 10) {
      console.log(`... and ${notFoundWords.length - 10} more`);
    }
  }
  
  // Show sample
  console.log("\n🔤 Sample (first 5 words):");
  enhancedWords.slice(0, 5).forEach(item => {
    console.log(`   "${item.word}" → ${item.phonetic.substring(0, 40)}${item.phonetic.length > 40 ? '...' : ''}`);
  });
  
  console.log(`\n💾 Saved to: ${outputPath}`);
  
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error("Full error:", error);
}