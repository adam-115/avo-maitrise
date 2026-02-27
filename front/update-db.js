const fs = require('fs');
const data = JSON.parse(fs.readFileSync('db.json', 'utf8'));
if (!data.Task) {
    data.Task = [];
    fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
    console.log('Task collection initialized.');
}
