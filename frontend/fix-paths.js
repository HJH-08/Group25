const fs = require('fs');
const path = require('path');

// Read the index.html file
const indexPath = path.join(__dirname, 'build', 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// Replace all absolute paths with relative paths
htmlContent = htmlContent.replace(/href="\//g, 'href="./');
htmlContent = htmlContent.replace(/src="\//g, 'src="./');

// Write back to the file
fs.writeFileSync(indexPath, htmlContent);

console.log('Fixed paths in index.html');