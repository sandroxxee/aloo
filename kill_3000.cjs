const { execSync } = require('child_process');
try {
  const output = execSync('ss -lptn \'sport = :3000\'').toString();
  console.log(output);
  const match = output.match(/pid=(\d+)/);
  if (match) {
    console.log('Killing pid:', match[1]);
    process.kill(parseInt(match[1]), 9);
  }
} catch (e) { console.log(e.message); }
