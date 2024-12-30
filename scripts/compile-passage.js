const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Generate a valid IFID (UUID format)
function generateIFID() {
    return crypto.randomUUID().toUpperCase();
}

// Get the passage name from npm arguments
const passageName = process.env.npm_config_passage;

console.log('Detected passage name:', passageName);

if (!passageName) {
    console.error('Please provide a passage name using: npm run test:passage --passage=bawra_01');
    process.exit(1);
}

// Function to get story component content
function getStoryComponentContent() {
    const projectDir = path.join(__dirname, '../project/twee');
    let content = '';

    // Array of core story files to include
    const coreFiles = [
        'storyJavascript.tw',
        'StoryBanner.tw',
        'StoryCaption.tw',
        'StoryInit.tw',
        'story.tw',
        'conclusion.tw'
    ];

    coreFiles.forEach(file => {
        const filePath = path.join(projectDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`Including story component: ${file}`);
            content += fs.readFileSync(filePath, 'utf8') + '\n\n';
        } else {
            console.log(`Warning: Could not find ${file}`);
        }
    });

    return content;
}

// Function to embed assets
function embedAssets() {
    const assetsDir = path.join(__dirname, '../assets');
    let embeddedContent = '';

    if (fs.existsSync(assetsDir)) {
        const assetFiles = fs.readdirSync(assetsDir);

        assetFiles.forEach(file => {
            const filePath = path.join(assetsDir, file);
            const ext = path.extname(file).toLowerCase();

            console.log(`Embedding asset: ${file}`);

            if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext)) {
                // Base64 encode images
                const base64 = fs.readFileSync(filePath).toString('base64');
                embeddedContent += `/* Embedded Asset: ${file} */\n<img src="data:image/${ext.slice(1)};base64,${base64}" alt="${file}" />\n\n`;
            } else if (['.css', '.js'].includes(ext)) {
                // Inline CSS/JS
                const assetContent = fs.readFileSync(filePath, 'utf8');
                if (ext === '.css') {
                    embeddedContent += `<style>${assetContent}</style>\n\n`;
                } else if (ext === '.js') {
                    embeddedContent += `<script>${assetContent}</script>\n\n`;
                }
            } else {
                console.log(`Skipping unsupported asset type: ${file}`);
            }
        });
    } else {
        console.log('No assets directory found. Skipping asset embedding.');
    }

    return embeddedContent;
}

// Function to compile the passage
function compilePassage() {
    const storyContent = getStoryComponentContent();
    const embeddedAssets = embedAssets();

    const passageContent = `/* Compiled Passage: ${passageName} */\n\n` +
                           `/* Embedded Assets */\n${embeddedAssets}\n` +
                           `/* Story Content */\n${storyContent}\n`;

    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const outputPath = path.join(outputDir, `${passageName}.html`);
    fs.writeFileSync(outputPath, passageContent, 'utf8');

    console.log(`Passage compiled successfully: ${outputPath}`);

    updateIndexFile(passageName);
}

// Update dist/index.html to set the start passage
function updateIndexFile(startPassage) {
    const distPath = path.join(__dirname, '../dist/index.html');
    if (!fs.existsSync(distPath)) {
        console.error('dist/index.html not found. Ensure the main game file exists.');
        return;
    }

    let indexContent = fs.readFileSync(distPath, 'utf8');

    // Validate that the passage exists in the story content
    if (!indexContent.includes(`"name": "${startPassage}"`)) {
        console.error(`Passage "${startPassage}" not found in dist/index.html. Ensure it is included in the game.`);
        return;
    }

    // Replace the start passage dynamically in the StoryData object
    indexContent = indexContent.replace(/"start":\s*"[^"]*"/, `"start": "${startPassage}"`);

    fs.writeFileSync(distPath, indexContent, 'utf8');
    console.log(`Updated dist/index.html to set the start passage: ${startPassage}`);
}

compilePassage();
