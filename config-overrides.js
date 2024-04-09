// config-overrides.js
const { override, addWebpackAlias } = require('customize-cra');

module.exports = override(
  // Add other customizations here
  (config) => {
    config.resolve.fallback = { 
      ...config.resolve.fallback,
      'fs': false
    };
    return config;
  }
);
