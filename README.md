# disk-read-experiment

Is it faster to run node.js disk operations with maximal parallelism? Or to chain them? Or something in between? This experiment tries to find out.

The test app is the equivalent to `du` - Go through a directory tree, stat every entry and get its size. Tally it up.

### Usage

```bash
npm install
./src/bin/du.js -h
./src/bin/experiment.js -h
``` 

Then follow the instructions.

### Results

See the blog article.
