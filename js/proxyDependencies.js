const fs = require('fs');
const path = require('path');

let erudaEnabled = false;

const settingsPath = path.join(__dirname, '..', 'settings.json');

try {
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

  // Check if 'eruda' is enabled in settings.json
  if (settings.eruda && settings.eruda.enabled === true) {
    erudaEnabled = true;
  }
} catch (error) {
  console.error('Error reading settings.json:', error);
}

const eruda = erudaEnabled;

module.exports = { eruda };
