const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const chokidar = require('chokidar');
const matter = require('gray-matter');

// Function to format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Read the blog template
const blogTemplate = fs.readFileSync(path.join(__dirname, 'src', 'templates', 'blog.html'), 'utf-8');

// Function to convert markdown file to HTML with frontmatter support
async function convertBlogPostToHtml(mdPath, outputPath) {
    try {
        const fileContent = await fs.readFile(mdPath, 'utf-8');
        const { data, content } = matter(fileContent);

        // Remove the first h1 header from content since we'll use the title from frontmatter
        const contentWithoutTitle = content.replace(/^#\s+.*\n/, '');
        const htmlContent = marked(contentWithoutTitle);

        let template = blogTemplate;
        template = template.replace(/\${title}/g, data.title);
        template = template.replace(/\${date}/g, data.date);
        template = template.replace(/\${formattedDate}/g, formatDate(data.date));
        template = template.replace('${tags}', data.tags ? data.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '');
        template = template.replace('${content}', htmlContent);

        await fs.outputFile(outputPath, template);
        console.log(`Converted blog post: ${mdPath} to ${outputPath}`);
    } catch (err) {
        console.error(`Error converting blog post ${mdPath}:`, err);
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
                    const { data, content: postContent } = matter(content);
                    const excerpt = postContent.split('\n').slice(0, 3).join('\n'); // Get first 3 lines for excerpt
                    return {
                        title: data.title,
                        date: data.date,
                        tags: data.tags,
                        slug: path.basename(file, '.md'),
                        excerpt: marked.parse(excerpt)
                    };
                })
        );

        // Sort posts by date
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Save posts data to JSON file
        await fs.outputFile(
            path.join(__dirname, 'dist', 'blog', 'posts.json'),
            JSON.stringify(posts, null, 2)
        );

        const blogListHtml = posts
            .map(post => `
                <article class="blog-preview">
                    <h2><a href="${post.slug}.html">${post.title}</a></h2>
                    <div class="post-meta">
                        <time datetime="${post.date}">${formatDate(post.date)}</time>
                        ${post.tags ? `<div class="tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                    </div>
                </article>
            `)
            .join('\n');

        const indexContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Blog - Findata</title>
                <link rel="stylesheet" href="../css/style.css">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            </head>
            <body>
                <nav class="nav-container">
                    <a href="../index.html" class="logo">Findata</a>
                    <ul class="nav-links">
                        <div class="nav-group primary">
                            <li><a href="../index.html#company">Company</a></li>
                            <li><a href="../index.html#services">Services</a></li>
                            <li><a href="../index.html#product">Product</a></li>
                            <li><a href="../blog/index.html">Blog</a></li>
                        </div>
                        <div class="nav-group secondary">
                            <li><a href="#search" class="search-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </a></li>
                            <li><a href="#login" class="login-btn">Login</a></li>
                            <li><a href="#get-started" class="cta-btn">Get in touch</a></li>
                        </div>
                    </ul>
                </nav>
                <main class="blog-index">
                    <h1>Latest Blog Posts</h1>
                    <div class="blog-list">
                        ${blogListHtml}
                    </div>
                </main>
                <script src="../js/main.js"></script>
            </body>
            </html>
        `;

        await fs.outputFile(outputPath, indexContent);
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

    // Ensure index.html exists in dist
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (!await fs.pathExists(indexPath)) {
        await fs.copy(path.join(__dirname, 'src', 'index.html'), indexPath);
        console.log('Created initial index.html');
    }

    // Process blog posts
    const blogDir = path.join(__dirname, 'src', 'content', 'blog');
    const blogFiles = await fs.readdir(blogDir);

    for (const file of blogFiles) {
        if (file.endsWith('.md')) {
            const mdPath = path.join(blogDir, file);
            const htmlPath = path.join(__dirname, 'dist', 'blog', file.replace('.md', '.html'));
            await convertBlogPostToHtml(mdPath, htmlPath);
        }
    }

    // Build blog index
    await buildBlogIndex();
}

// Watch mode
if (process.argv.includes('--watch')) {
    console.log('Watching for changes...');
    const watcher = chokidar.watch([
        'src/content/**/*.md',
        'src/css/**/*',
        'src/js/**/*',
        'src/index.html',
        'src/templates/**/*'
    ], {
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