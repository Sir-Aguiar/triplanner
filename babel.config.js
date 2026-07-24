module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    overrides: [
      {
        // Apenas models do WatermelonDB precisam de class-properties após decorators.
        // Não aplicar em node_modules (quebra Event.js do RN).
        test: (filename) =>
          typeof filename === 'string' &&
          /[\\/]src[\\/]database[\\/]models[\\/].*\.tsx?$/.test(filename),
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-transform-class-properties', { loose: true }],
        ],
      },
    ],
  };
};
