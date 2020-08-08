const libUtil = require('util');
const libPath = require('path');
const libFs = require('fs');

const asyncReaddir = libUtil.promisify(libFs.readdir);
const asyncStat = libUtil.promisify(libFs.stat);

/**
 * Get disk usage for given path. Recursively. Use parallelism to determine how many IO tasks to run at one time.
 * @param path
 * @param parallelism
 * @param {function(op:string, path:string, info:string)} debugLog
 * @return {Promise<DiskUsageReport>}
 */
async function diskUsage(path, parallelism, debugLog = undefined) {
  const result = /** @lends DiskUsageReport.prototype */ {
    path: libPath.resolve(path),
    parallelism,
    startedAt: new Date(),
    completedAt: null,
    maxActive: 0,
    size: 0,
    files: 0,
    directories: 0,
  };
  let activeCount = 0;
  const queue = [];
  let completed;

  let resolveReject = {};
  const resultPromise = new Promise((resolve, reject) => {
    resolveReject = { resolve, reject };
  });
  Object.assign(resultPromise, resolveReject);

  enqueueStat(path);
  tick();

  return resultPromise;

  function enqueueRead(path) {
    queue.push({ path, exec: readOp });
  }

  function enqueueStat(path) {
    queue.push({ path, exec: statOp });
  }

  function tick() {
    if (completed) {
      return;
    }

    if (parallelism && parallelism <= activeCount) {
      // We have to wait for something to finish
      return;
    }

    if (!activeCount && !queue.length) {
      // Nothing else to do, we are done
      completed = true;
      result.completedAt = new Date();
      resultPromise.resolve(result);
      return;
    }

    // Launch the next task
    const op = queue.pop();
    activeCount++;
    Promise.resolve()
      .then(() => op.exec(op))
      .then(
        () => {
          activeCount--;
          tick();
        },
        err => {
          // Error!
          activeCount--;
          if (!completed) {
            completed = true;
            resultPromise.reject(err);
          }
        }
      );

    // Immediately try again
    tick();
  }

  async function readOp({ path }) {
    /** @type {string[]} */
    const files = await asyncReaddir(path);

    debugLog && debugLog('READ', path, `${files.length} items`);

    for (const file of files) {
      enqueueStat(libPath.resolve(path, file));
    }
  }

  async function statOp({ path }) {
    /** @type {Stats} */
    const stats = await asyncStat(path);
    if (stats.isDirectory()) {
      result.directories++;
      enqueueRead(path);
      debugLog && debugLog('STAT', path, `DIR`);
    } else if (stats.isFile()) {
      result.files++;
      result.size += stats.size;
      debugLog && debugLog('STAT', path, `${stats.size} bytes`);
    } else {
      debugLog && debugLog('STAT', path, `---`);
    }
  }
}

module.exports = {
  diskUsage,
};
