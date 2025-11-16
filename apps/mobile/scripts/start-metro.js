#!/usr/bin/env node

/**
 * Custom Metro bundler start script
 * Workaround for connect middleware issue with certain Node.js versions
 */

const Metro = require('metro');
const {loadConfig} = require('metro-config');
const {Terminal} = require('metro-core');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const watchFolders = [path.resolve(projectRoot, '../..')];

async function runServer() {
  const terminal = new Terminal(process.stdout);

  terminal.log('Starting Metro bundler...');

  try {
    const config = await loadConfig({cwd: projectRoot}, {
      watchFolders,
      resolver: {
        nodeModulesPaths: [
          path.resolve(projectRoot, 'node_modules'),
          path.resolve(projectRoot, '../../node_modules'),
        ],
      },
    });

    const serverInstance = await Metro.runServer(config, {
      hmrEnabled: true,
      port: 8081,
    });

    terminal.log('Metro bundler is running on port 8081');
    terminal.log('');
    terminal.log('To reload the app, press "r"');
    terminal.log('To open developer menu, press "d"');

    // Handle process termination
    process.on('SIGINT', () => {
      terminal.log('Shutting down Metro bundler...');
      serverInstance.end();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      terminal.log('Shutting down Metro bundler...');
      serverInstance.end();
      process.exit(0);
    });

  } catch (error) {
    terminal.log(`Error starting Metro: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

runServer();
