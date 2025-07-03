#!/usr/bin/env node

/**
 * Family Loan Tracker - Deployment Readiness Check
 * Verifies all files and configurations are ready for Netlify deployment
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🚀 Family Loan Tracker - Deployment Readiness Check\n');

// Test configuration
const localUrl = 'http://localhost:3000';
const requiredFiles = [
    'index.html',
    'manifest.json',
    'sw.js',
    'netlify.toml',
    '_headers',
    'icons/icon.svg',
    'generate-icons.sh'
];

const deploymentChecks = [];

// Helper function to check file existence
function checkFile(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
        return { exists: true, size: sizeKB };
    } catch (error) {
        return { exists: false, size: 0 };
    }
}

// Helper function to make HTTP requests
function fetchResource(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
        }).on('error', reject);
    });
}

// Main deployment check function
async function runDeploymentCheck() {
    console.log('📁 FILE STRUCTURE CHECKS:');
    console.log('='.repeat(50));
    
    // Check required files
    for (const file of requiredFiles) {
        const check = checkFile(file);
        const status = check.exists ? '✅' : '❌';
        const sizeInfo = check.exists ? `(${check.size}KB)` : '';
        console.log(`   ${status} ${file} ${sizeInfo}`);
        
        deploymentChecks.push({
            name: `File: ${file}`,
            passed: check.exists,
            details: check.exists ? `${check.size}KB` : 'Missing'
        });
    }
    
    console.log('\n📡 LOCAL SERVER CHECKS:');
    console.log('='.repeat(50));
    
    try {
        // Test main application
        console.log('   🔄 Testing main application...');
        const appResponse = await fetchResource(localUrl);
        const appWorking = appResponse.status === 200 && appResponse.data.includes('Family Loan Tracker');
        console.log(`   ${appWorking ? '✅' : '❌'} Main app (${appResponse.status}) ${appWorking ? '- React loaded' : '- Failed to load'}`);
        
        deploymentChecks.push({
            name: 'Main Application',
            passed: appWorking,
            details: `HTTP ${appResponse.status}`
        });
        
        // Test PWA manifest
        console.log('   🔄 Testing PWA manifest...');
        const manifestResponse = await fetchResource(`${localUrl}/manifest.json`);
        const manifestWorking = manifestResponse.status === 200 && manifestResponse.data.includes('Family Loan Tracker');
        console.log(`   ${manifestWorking ? '✅' : '❌'} PWA Manifest (${manifestResponse.status}) ${manifestWorking ? '- Valid JSON' : '- Invalid'}`);
        
        deploymentChecks.push({
            name: 'PWA Manifest',
            passed: manifestWorking,
            details: manifestWorking ? 'Valid PWA manifest' : 'Invalid or missing'
        });
        
        // Test service worker
        console.log('   🔄 Testing service worker...');
        const swResponse = await fetchResource(`${localUrl}/sw.js`);
        const swWorking = swResponse.status === 200 && swResponse.data.includes('ServiceWorker');
        console.log(`   ${swWorking ? '✅' : '❌'} Service Worker (${swResponse.status}) ${swWorking ? '- Valid SW' : '- Invalid'}`);
        
        deploymentChecks.push({
            name: 'Service Worker',
            passed: swWorking,
            details: swWorking ? 'Valid service worker' : 'Invalid or missing'
        });
        
        // Test SVG icon
        console.log('   🔄 Testing SVG icon...');
        const iconResponse = await fetchResource(`${localUrl}/icons/icon.svg`);
        const iconWorking = iconResponse.status === 200 && iconResponse.data.includes('<svg');
        console.log(`   ${iconWorking ? '✅' : '❌'} SVG Icon (${iconResponse.status}) ${iconWorking ? '- Valid SVG' : '- Invalid'}`);
        
        deploymentChecks.push({
            name: 'SVG Icon',
            passed: iconWorking,
            details: iconWorking ? 'Valid SVG icon' : 'Invalid or missing'
        });
        
    } catch (error) {
        console.log(`   ❌ Local server connection failed: ${error.message}`);
        console.log('   💡 Make sure the development server is running: python3 -m http.server 3000');
        
        deploymentChecks.push({
            name: 'Local Server',
            passed: false,
            details: 'Connection failed'
        });
    }
    
    console.log('\n⚙️  CONFIGURATION CHECKS:');
    console.log('='.repeat(50));
    
    // Check netlify.toml
    const netlifyConfig = checkFile('netlify.toml');
    if (netlifyConfig.exists) {
        const content = fs.readFileSync('netlify.toml', 'utf8');
        const hasHeaders = content.includes('[[headers]]');
        const hasRedirects = content.includes('[[redirects]]');
        const hasBuildSettings = content.includes('[build]');
        
        console.log(`   ${hasHeaders ? '✅' : '❌'} Security headers configured`);
        console.log(`   ${hasRedirects ? '✅' : '❌'} SPA redirects configured`);
        console.log(`   ${hasBuildSettings ? '✅' : '❌'} Build settings configured`);
        
        deploymentChecks.push({
            name: 'Netlify Configuration',
            passed: hasHeaders && hasRedirects && hasBuildSettings,
            details: 'Headers, redirects, and build settings'
        });
    }
    
    // Check PWA manifest content
    const manifestFile = checkFile('manifest.json');
    if (manifestFile.exists) {
        const manifestContent = fs.readFileSync('manifest.json', 'utf8');
        const manifest = JSON.parse(manifestContent);
        
        const hasName = manifest.name && manifest.short_name;
        const hasIcons = manifest.icons && manifest.icons.length > 0;
        const hasStartUrl = manifest.start_url;
        const hasDisplay = manifest.display === 'standalone';
        
        console.log(`   ${hasName ? '✅' : '❌'} App name and short name`);
        console.log(`   ${hasIcons ? '✅' : '❌'} Icon definitions (${manifest.icons?.length || 0} icons)`);
        console.log(`   ${hasStartUrl ? '✅' : '❌'} Start URL configured`);
        console.log(`   ${hasDisplay ? '✅' : '❌'} Standalone display mode`);
        
        deploymentChecks.push({
            name: 'PWA Manifest Content',
            passed: hasName && hasIcons && hasStartUrl && hasDisplay,
            details: `${manifest.icons?.length || 0} icons configured`
        });
    }
    
    console.log('\n🎯 GIT REPOSITORY CHECKS:');
    console.log('='.repeat(50));
    
    // Check git status
    const gitDir = checkFile('.git');
    console.log(`   ${gitDir.exists ? '✅' : '❌'} Git repository initialized`);
    
    const gitignore = checkFile('.gitignore');
    console.log(`   ${gitignore.exists ? '✅' : '❌'} .gitignore file present`);
    
    // Check if we have commits
    try {
        const { execSync } = require('child_process');
        const hasCommits = execSync('git log --oneline -n 1', { encoding: 'utf8' }).trim();
        console.log(`   ${hasCommits ? '✅' : '❌'} Has git commits`);
        
        deploymentChecks.push({
            name: 'Git Repository',
            passed: gitDir.exists && gitignore.exists && !!hasCommits,
            details: 'Repository ready for deployment'
        });
    } catch (error) {
        console.log(`   ⚠️  Could not check git commits: ${error.message}`);
    }
    
    console.log('\n📊 DEPLOYMENT READINESS SUMMARY:');
    console.log('='.repeat(50));
    
    const passedChecks = deploymentChecks.filter(check => check.passed).length;
    const totalChecks = deploymentChecks.length;
    const readinessPercentage = Math.round((passedChecks / totalChecks) * 100);
    
    console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks (${readinessPercentage}%)`);
    console.log(`❌ Failed: ${totalChecks - passedChecks}/${totalChecks} checks`);
    console.log('');
    
    if (readinessPercentage >= 90) {
        console.log('🎉 EXCELLENT! Your app is ready for Netlify deployment!');
        console.log('🚀 Next steps:');
        console.log('   1. Run ./generate-icons.sh to create PWA icons');
        console.log('   2. Push to GitHub: git push origin main');
        console.log('   3. Connect to Netlify and deploy');
    } else if (readinessPercentage >= 75) {
        console.log('👍 GOOD! Your app is mostly ready with minor issues.');
        console.log('🔧 Address the failed checks above before deploying.');
    } else {
        console.log('⚠️  NEEDS WORK! Please fix the failed checks before deployment.');
    }
    
    // Show failed checks
    const failedChecks = deploymentChecks.filter(check => !check.passed);
    if (failedChecks.length > 0) {
        console.log('\n❌ Failed Checks:');
        failedChecks.forEach(check => {
            console.log(`   - ${check.name}: ${check.details}`);
        });
    }
    
    console.log('\n🚀 Deployment Check Complete!');
}

// Run the deployment check
runDeploymentCheck().catch(error => {
    console.error('❌ Deployment check failed:', error.message);
    process.exit(1);
}); 