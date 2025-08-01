const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper asset resolution
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'svg');

// Clear cache and enable symlinks
config.resetCache = true;
config.resolver.symlinks = false;

module.exports = config;