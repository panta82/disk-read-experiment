#!/usr/bin/env node

const { program } = require('commander');

const { diskUsage } = require('../disk_usage');

program
  .name('du')
  .usage(`[params] [target path]`)
  .description('Run a disk-usage task against given directory (or CWD) and print the report')
  .option('-p, --parallelism <value>', 'Determine how many ops will we try to do at one time.', '0')
  .option('-d, --debug', 'Print debug output')
  .parse();

const path = program.args[0] || process.cwd();
const parallelism = Number(program.parallelism) || 0;

const debugLog = program.debug
  ? (op, path, info) => console.log(`    ${op} ${path.slice(0, 150).padEnd(150)} [${info}]`)
  : null;
console.log(`Tallying usage for ${path}, with parallelism = ${parallelism}`);

Promise.resolve()
  .then(() =>
    diskUsage(path, parallelism, debugLog).then(report => {
      if (debugLog) {
        console.log('-----------');
      }
      console.log(`       Path: ${report.path}`);
      console.log(`Parallelism: ${report.parallelism}`);
      console.log(`      Files: ${report.files}`);
      console.log(`       Dirs: ${report.directories}`);
      console.log(`     Errors: ${report.errorPaths.length}`);
      console.log(`    Elapsed: ${report.completedAt - report.startedAt}ms`);
      console.log(
        `       Size: ${new Intl.NumberFormat('en-US').format(Math.round(report.size / 1000))}kb`
      );
    })
  )
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
