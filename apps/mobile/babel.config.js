// The Lingui macro runs first so `t` and `<Trans>` become catalog lookups before anything else sees them.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['@lingui/babel-plugin-lingui-macro'],
  };
};
