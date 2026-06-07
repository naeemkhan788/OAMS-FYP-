const fs = require('fs');
const path = require('path');
const dir = 'e:/OAMS/online-attendance-management-system/src/pages/dashboard';

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const f of files) {
    const fullPath = path.join(directory, f);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (f.endsWith('.jsx') || f.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let originalContent = content;
      
      // Replace 'http://localhost:5002/api...' with `${API_BASE}...`
      // For this to work, we also need to ensure API_BASE is imported.
      
      // Let's just use the import.meta.env pattern since we don't know where api.js is relative to each file
      const replacementStr = "${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}";
      
      // Replace single quoted strings
      content = content.replace(/'http:\/\/localhost:5002\/api([^']*)'/g, '`' + replacementStr + '$1`');
      
      // Replace double quoted strings
      content = content.replace(/"http:\/\/localhost:5002\/api([^"]*)"/g, '`' + replacementStr + '$1`');
      
      // Replace within template literals
      content = content.replace(/http:\/\/localhost:5002\/api/g, replacementStr);

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + fullPath);
      }
    }
  }
}

processDir(dir);
