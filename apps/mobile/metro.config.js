// Sentry's Expo metro config adds source maps for crash reports; it wraps Expo's default config.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
