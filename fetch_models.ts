
import https from 'https';
import fs from 'fs';

const url = 'https://openrouter.ai/api/v1/models';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const geminiModels = json.data
                .filter(m => m.id.includes('gemini') && m.id.includes('flash'))
                .map(m => m.id);
            fs.writeFileSync('gemini_models.txt', geminiModels.join('\n'));
            console.log('Saved models to gemini_models.txt');
        } catch (e) {
            console.error(e);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
