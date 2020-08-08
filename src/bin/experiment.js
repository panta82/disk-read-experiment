#!/usr/bin/env node

const { program } = require('commander');

const { diskUsage } = require('../disk_usage');

program
  .name('experiment')
  .usage(`[params] [target path]`)
  .description(
    'Perform a disk-usage experiment using a range of parallelisms. Prints out a CSV report suitable for importing into a spreadsheet.'
  )
  .option(
    '-p, --parallelisms <value>',
    'Space-separated of parallelism values to test. Use 0 for infinite.',
    '1 2 3 4 5 6 7 8 9 0'
  )
  .parse();

Promise.resolve()
  .then(async () => {
    const parallelisms = (program.parallelisms || '').split(' ').map(item => {
      const value = parseInt(item.trim(), 10);
      if (isNaN(value) || value < 0) {
        throw `Invalid parallelism value: ${item}`;
      }
      return value;
    });

    const path = program.args[0] || process.cwd();
    console.log(
      `Performing an experiment against ${path}, with parallelisms: ${parallelisms.join(' ')}`
    );

    const finalReport = [];

    for (const parallelism of parallelisms) {
      process.stdout.write(`    Running with ${parallelism}...`);
      const report = await diskUsage(path, parallelism);
      const duration = report.completedAt - report.startedAt;
      finalReport.push({ parallelism, duration });
      process.stdout.write(` ${duration}ms (max active: ${report.maxActive})\n`);
    }

    console.log('Done\n\n');

    for (const item of finalReport) {
      console.log(item.parallelism + '\t' + item.duration);
    }
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
