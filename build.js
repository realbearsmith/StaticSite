const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const chokidar = require('chokidar');

// HTML template for wrapping markdown content
const createHtmlTemplate = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - My Website</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <header>
        <nav>
            <div class="nav-container">
                <a href="../index.html" class="logo">My Site</a>
                <ul class="nav-links">
                    <li><a href="../index.html">Home</a></li>
                    <li><a href="../blog/index.html">Blog</a></li>
                    <li><a href="../pages/about.html">About</a></li>
                    <li><a href="../pages/faq.html">FAQ</a></li>
                </ul>
            </div>
        </nav>
    </header>
    <main>
        <article class="content">
            ${content}
        </article>
    </main>
    <footer>
        <p>&copy; 2024 My Website. All rights reserved.</p>
    </footer>
    <script src="../js/main.js"></script>
</body>
</html>
`;

// Function to convert markdown file to HTML
async function convertMarkdownToHtml(mdPath, outputPath) {
    try {
        const mdContent = await fs.readFile(mdPath, 'utf-8');
        const htmlContent = marked(mdContent);
        const title = path.basename(mdPath, '.md');
        const fullHtml = createHtmlTemplate(title, htmlContent);
        await fs.outputFile(outputPath, fullHtml);
        console.log(`Converted ${mdPath} to ${outputPath}`);
    } catch (err) {
        console.error(`Error converting ${mdPath}:`, err);
    }
}

// Function to build the blog index
async function buildBlogIndex() {
    const blogDir = path.join(__dirname, 'src', 'content', 'blog');
    const outputPath = path.join(__dirname, 'dist', 'blog', 'index.html');

    try {
        const files = await fs.readdir(blogDir);
        const posts = await Promise.all(
            files
                .filter(file => file.endsWith('.md'))
                .map(async file => {
                    const content = await fs.readFile(path.join(blogDir, file), 'utf-8');
                    const title = path.basename(file, '.md');
                    return { title, file };
                })
        );

        const blogListHtml = posts
            .map(post => `<li><a href="${post.title}.html">${post.title}</a></li>`)
            .join('\n');

        const indexContent = `
            <h1>Blog Posts</h1>
            <ul class="post-list">
                ${blogListHtml}
            </ul>
        `;

        const fullHtml = createHtmlTemplate('Blog', indexContent);
        await fs.outputFile(outputPath, fullHtml);
        console.log('Built blog index');
    } catch (err) {
        console.error('Error building blog index:', err);
    }
}

// Main build function
async function build() {
    // Ensure dist directory exists
    await fs.ensureDir(path.join(__dirname, 'dist'));

    // Copy static assets
    await fs.copy(path.join(__dirname, 'src', 'css'), path.join(__dirname, 'dist', 'css'));
    await fs.copy(path.join(__dirname, 'src', 'js'), path.join(__dirname, 'dist', 'js'));
    console.log('Copied static assets');

    // Process pages
    const pagesDir = path.join(__dirname, 'src', 'content', 'pages');
    const pagesFiles = await fs.readdir(pagesDir);

    for (const file of pagesFiles) {
        if (file.endsWith('.md')) {
            const mdPath = path.join(pagesDir, file);
            const htmlPath = path.join(__dirname, 'dist', 'pages', file.replace('.md', '.html'));
            await convertMarkdownToHtml(mdPath, htmlPath);
        }
    }

    // Process blog posts
    const blogDir = path.join(__dirname, 'src', 'content', 'blog');
    const blogFiles = await fs.readdir(blogDir);

    for (const file of blogFiles) {
        if (file.endsWith('.md')) {
            const mdPath = path.join(blogDir, file);
            const htmlPath = path.join(__dirname, 'dist', 'blog', file.replace('.md', '.html'));
            await convertMarkdownToHtml(mdPath, htmlPath);
        }
    }

    // Build blog index
    await buildBlogIndex();
}

// Watch mode
if (process.argv.includes('--watch')) {
    console.log('Watching for changes...');
    const watcher = chokidar.watch(['src/content/**/*.md', 'src/css/**/*', 'src/js/**/*'], {
        persistent: true
    });

    watcher
        .on('add', path => build())
        .on('change', path => build())
        .on('unlink', path => build());
} else {
    // Single build
    build().catch(err => {
        console.error('Build failed:', err);
        process.exit(1);
    });
} 