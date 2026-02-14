/**
 * Build Configuration Script
 * Loads environment variables and creates a runtime config file
 *
 * Usage: node scripts/build-config.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  No .env file found. Using .env.example as template.');
    console.warn('   Copy .env.example to .env and add your credentials.');
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return;

    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();

    if (key && value) {
      env[key.trim()] = value;
    }
  });

  return env;
}

// Generate runtime config
function generateConfig() {
  const env = loadEnv();

  console.log('Loaded env:', env);

  const config = {
    github: {
      clientId: env.GITHUB_CLIENT_ID || 'YOUR_GITHUB_CLIENT_ID',
      clientSecret: env.GITHUB_CLIENT_SECRET || 'YOUR_GITHUB_CLIENT_SECRET'
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || ''
    },
    notion: {
      clientId: env.NOTION_CLIENT_ID || '',
      clientSecret: env.NOTION_CLIENT_SECRET || ''
    }
  };

  // Validate GitHub config
  const hasGitHubConfig = config.github.clientId !== 'YOUR_GITHUB_CLIENT_ID' &&
                          config.github.clientSecret !== 'YOUR_GITHUB_CLIENT_SECRET';

  if (!hasGitHubConfig) {
    console.error('❌ GitHub OAuth credentials not configured!');
    console.error('   1. Copy .env.example to .env');
    console.error('   2. Add your GitHub Client ID and Secret');
    console.error('   3. Run this script again');
    process.exit(1);
  }

  return config;
}

// Write config to file
function writeConfig(config) {
  const outputPath = path.join(__dirname, '..', 'src', 'config', 'runtime-config.json');

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
  console.log('✅ Runtime config generated successfully!');
  console.log(`   File: ${outputPath}`);
}

// Main
try {
  const config = generateConfig();
  writeConfig(config);
} catch (error) {
  console.error('❌ Error generating config:', error.message);
  process.exit(1);
}
