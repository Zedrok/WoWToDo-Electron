const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

pngToIco(path.join(__dirname, 'public', 'icon.png'))
  .then(buf => {
    fs.writeFileSync(path.join(__dirname, 'public', 'icon.ico'), buf);
    console.log('icon.ico created:', buf.length, 'bytes');
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
