const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

/**
 * Native build output, hidden from Metro's file watcher.
 *
 * Windows has no Watchman, so Metro falls back to a plain fs.watch crawler that
 * throws ENOENT — and takes the whole dev server down — when a directory it is
 * watching disappears mid-build. Gradle churns through thousands of such
 * directories under `android/build` in the app *and* in every native module,
 * so running `npm run android` while Metro is up would reliably kill Metro.
 *
 * None of these paths hold JavaScript the bundler needs.
 */
const nativeBuildOutput = [
  /.*[\\/]android[\\/]build[\\/].*/,
  /.*[\\/]android[\\/]app[\\/]build[\\/].*/,
  /.*[\\/]android[\\/]\.cxx[\\/].*/,
  /.*[\\/]android[\\/]\.gradle[\\/].*/,
  /.*[\\/]ios[\\/]build[\\/].*/,
  /.*[\\/]ios[\\/]Pods[\\/].*/,
  /.*[\\/]vendor[\\/]bundle[\\/].*/,
];

const config = {
  resolver: {
    blockList: nativeBuildOutput,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
