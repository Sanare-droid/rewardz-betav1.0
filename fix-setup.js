/**
 * Quick setup and test script
 */
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Fixing Rewardz setup...\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from template...');
  if (fs.existsSync('env.example')) {
    fs.copyFileSync('env.example', '.env');
    console.log('✅ .env file created');
  } else {
    console.log('❌ env.example not found');
  }
} else {
  console.log('✅ .env file already exists');
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('pnpm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.log('❌ Failed to install dependencies:', error.message);
  }
} else {
  console.log('✅ Dependencies already installed');
}

console.log('\n🚀 Setup complete! You can now run:');
console.log('  pnpm dev     # Start development server');
console.log('  pnpm test    # Run tests');
console.log('  pnpm build   # Build for production');
