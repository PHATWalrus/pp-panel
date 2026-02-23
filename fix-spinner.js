const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, 'node_modules', 'react-loader-spinner', 'package.json');

if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Update peer dependencies to include React 19
  if (pkg.peerDependencies) {
    pkg.peerDependencies.react = "^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0";
    pkg.peerDependencies['react-dom'] = "^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0";
  }
  
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
  console.log('Fixed react-loader-spinner peer dependencies for React 19');
}