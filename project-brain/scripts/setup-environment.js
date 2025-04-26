/**
 * Environment Setup Script
 * 
 * This script helps set up environment-specific configurations.
 * Run it with npm run setup:env -- [environment]
 * 
 * Example: npm run setup:env -- development
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Environment templates
const templates = {
  development: {
    NODE_ENV: 'development',
    NEXT_PUBLIC_API_URL: 'http://localhost:3000/api',
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    NEXT_PUBLIC_ENVIRONMENT: 'development',
    DEBUG: 'true'
  },
  staging: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_API_URL: 'https://staging.your-app-url.com/api',
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    NEXT_PUBLIC_ENVIRONMENT: 'staging',
    DEBUG: 'false'
  },
  production: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_API_URL: 'https://your-production-url.com/api',
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    NEXT_PUBLIC_ENVIRONMENT: 'production',
    DEBUG: 'false'
  }
};

// Get environment argument
const environment = process.argv[2] || 'development';

if (!['development', 'staging', 'production'].includes(environment)) {
  console.error('Invalid environment. Please choose development, staging, or production');
  process.exit(1);
}

console.log(`Setting up ${environment} environment configuration...`);

// Get template values for the specified environment
const template = templates[environment];
const questions = Object.keys(template);
const answers = {};

// Function to ask questions recursively
function askQuestion(index) {
  if (index >= questions.length) {
    generateEnvFile();
    return;
  }

  const question = questions[index];
  const defaultValue = template[question];

  rl.question(`${question} (${defaultValue}): `, (answer) => {
    answers[question] = answer || defaultValue;
    askQuestion(index + 1);
  });
}

// Function to generate the environment file
function generateEnvFile() {
  const envFileName = `.env.${environment}.local`;
  const envFilePath = path.join(process.cwd(), envFileName);
  
  let fileContent = '';
  for (const [key, value] of Object.entries(answers)) {
    fileContent += `${key}=${value}\n`;
  }

  fs.writeFileSync(envFilePath, fileContent);
  console.log(`Created ${envFileName} with the following configuration:`);
  console.log(fileContent);
  
  rl.close();
}

// Start asking questions
askQuestion(0); 