const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, 'settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

const eruda = settings.eruda?.enabled || false;

module.exports = { eruda };
