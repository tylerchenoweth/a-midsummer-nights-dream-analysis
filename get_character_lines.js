const fs = require('fs');

const play = JSON.parse(fs.readFileSync('midsummer-text.json', 'utf8'));

usableLines = []

for (const actKey of Object.keys(play)) {
    const act = play[actKey];

    if (actKey !== '1') continue;

    for (const sceneKey of Object.keys(act)) {
        const scene = act[sceneKey];

        for (const lineKey of Object.keys(scene)) {
            const line = scene[lineKey];

            if (typeof line === "object") {
                // spoken line
                console.log(line.speaker, ":", line.line);
                usableLines.push(line.line);
            }
        }
    }
}

