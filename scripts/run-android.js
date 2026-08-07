const { existsSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const localNinjaBin = path.join(projectRoot, '.tools', 'ninja', 'usr', 'bin');
const environment = { ...process.env };

if (!environment.JAVA_HOME && process.platform === 'linux') {
  environment.JAVA_HOME = '/usr/lib/jvm/java-17-openjdk-amd64';
}

if (!environment.ANDROID_HOME && process.platform === 'linux') {
  environment.ANDROID_HOME = '/home/ugur/Android/Sdk';
}

if (existsSync(path.join(localNinjaBin, process.platform === 'win32' ? 'ninja.exe' : 'ninja'))) {
  environment.PATH = `${localNinjaBin}${path.delimiter}${environment.PATH ?? ''}`;
}

environment.NODE_ENV = environment.NODE_ENV ?? 'development';

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(npxCommand, ['expo', 'run:android'], {
  cwd: projectRoot,
  env: environment,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
