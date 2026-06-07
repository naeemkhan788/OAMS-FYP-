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
      
      // Fix the messed up regex replacements
      content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL \|\| '\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5002\/api'\}'\}/g, "${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}");
      content = content.replace(/import\.meta\.env\.VITE_API_URL \|\| `\$\{import\.meta\.env\.VITE_API_URL \|\| '\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5002\/api'\}'}`/g, "import.meta.env.VITE_API_URL || 'http://localhost:5002/api'");
      content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5002\/api'\}/g, "${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}");
      
      // If there are multiple nestings like:
      // `${import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}'}`
      content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL \|\| '\\\$\{import\.meta\.env\.VITE_API_URL \|\| \\'http:\/\/localhost:5002\/api\\'\\}'\}/g, "${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}");
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed ' + fullPath);
      }
    }
  }
}

processDir(dir);
