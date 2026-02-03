const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../db.json');

try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    let changed = false;

    // Fix AmlFormConfig IDs
    if (data.AmlFormConfig) {
        data.AmlFormConfig.forEach(config => {
            if (typeof config.id === 'number') {
                config.id = String(config.id);
                changed = true;
            }
        });
    }

    // Fix MappingForm IDs and Foreign Keys
    if (data.MappingForm) {
        data.MappingForm.forEach(mapping => {
            if (typeof mapping.id === 'number') {
                mapping.id = String(mapping.id);
                changed = true;
            }
            if (typeof mapping.amlFormConfigID === 'number') {
                mapping.amlFormConfigID = String(mapping.amlFormConfigID);
                changed = true;
            }
        });
    }

    if (changed) {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        console.log("SUCCESS: Fixed DB IDs. Converted numbers to strings.");
    } else {
        console.log("No ID fixes needed.");
    }

} catch (err) {
    console.error("Error fixing DB:", err);
}
