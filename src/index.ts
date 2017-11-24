import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as tar from 'tar';
import * as mkdirp from 'mkdirp';

const npmPath = require.resolve('npm/bin/npm-cli');

/**
 * async/await version `child_process.fork` that returns stdout as a string
 * @param command
 * @param args
 * @param options
 * @returns {Promise<string>}
 */
export async function fork(command, args, options): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffers = [];

    const child = child_process.fork(command, args, options);

    child.stdout.on('data', (data) => {
      if (Buffer.isBuffer(data)) {
        buffers.push(data);
      } else if (typeof data === 'string') {
        buffers.push(Buffer.from(data, 'utf-8'));
      }
    });

    child.on('close', () => {
      resolve(Buffer.concat(buffers).toString('utf-8').trim());
    });

    child.on('error', reject);
  });
}

/**
 * Run `npm pack` command to download a tgz of the package
 * @param packagename
 * @param cwd
 * @returns {Promise<string>}
 */
export async function pack(packagename, cwd) {
  return fork(npmPath, ['pack', packagename], {
    cwd: cwd,
    execArgv: [],
    silent: true
  });
}

async function asyncMkdirp(dir) {
  return new Promise((resolve, reject) => {
    mkdirp(dir, e => {
      if (e) return reject(e);
      resolve();
    });
  });
}

async function asyncUnlink(filepath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filepath, e => {
      if (e) return reject(e);
      resolve();
    });
  });
}

/**
 * Extract previously packed package
 *
 * // Usage
 * const extractdir = await extract('color', '/tmp/', '/tmp/color-2.0.0.tgz')
 * require(extractdir)
 * @param packagename
 * @param cwd
 * @param filepath
 * @returns {Promise<string>}
 */
export async function extract(packagename, cwd, filepath) {
  const extractdir = path.join(cwd, packagename);
  await asyncMkdirp(extractdir);
  await tar.x({
    file: filepath,
    cwd: extractdir,
    strip: 1
  });
  await asyncUnlink(filepath);
  await fork(npmPath, ['install', '--no-save', '--no-package-lock', '--production'], {
    cwd: extractdir,
    execArgv: []
  });

  return extractdir;
}
