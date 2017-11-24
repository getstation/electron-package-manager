# electron-package-manager
Dynamically install and require modules in electron

## Usage
```javascript
import epm from 'electron-package-manager';

const CWD = '/tmp/test-plugins';
const PACKAGE = 'levelup';

epm
  .pack(PACKAGE, CWD)
  .then(packagename => epm.extract(PACKAGE, CWD, path.join(CWD, packagename)))
  .then(modulepath => {
    console.log('requiring', modulepath);
    const mylib = require(modulepath);
    console.log('required', mylib);
  });
```