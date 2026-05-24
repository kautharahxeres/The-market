const { execSync } = require('child_process');
const path = 'c:\\Users\\GIDEON\\Desktop\\THE MARKET';
try {
  const out = execSync(`cd /d "${path}" && git status --short && echo --- && git remote -v`, { stdio: 'pipe' });
  require('fs').writeFileSync('git-status-out.txt', out.toString());
  console.log('ok');
} catch (err) {
  require('fs').writeFileSync('git-status-out.txt', err.message + '\n' + (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : ''));
  console.error('error');
}
