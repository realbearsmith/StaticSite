// Markdown converter utility
const convertMarkdownToHtml = (markdown) => {
    return marked.parse(markdown);
};

// Function to load and render markdown content
async function loadMarkdownContent(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('Failed to load content');
        const markdown = await response.text();
        return convertMarkdownToHtml(markdown);
    } catch (error) {
        console.error('Error loading markdown:', error);
        return '<p>Error loading content</p>';
    }
}

// Function to load blog posts
async function loadBlogPosts() {
    const latestPostsElement = document.getElementById('latest-posts');
    if (!latestPostsElement) return;

    try {
        // In a real site, this would be loaded from a JSON file or API
        const posts = [
            { title: 'Welcome to my blog', file: 'posts/welcome.md', date: '2024-01-10' },
            { title: 'Getting Started', file: 'posts/getting-started.md', date: '2024-01-09' }
        ];

        const postsHtml = posts.map(post => `
            <article class="post">
                <h2>${post.title}</h2>
                <div class="post-meta">Posted on ${post.date}</div>
                <a href="/blog/${post.file.replace('.md', '.html')}">Read more</a>
            </article>
        `).join('');

        latestPostsElement.innerHTML = postsHtml;
    } catch (error) {
        console.error('Error loading blog posts:', error);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadBlogPosts();

    // If we're on a markdown page, load and render its content
    const markdownContent = document.getElementById('markdown-content');
    if (markdownContent && markdownContent.dataset.source) {
        loadMarkdownContent(markdownContent.dataset.source)
            .then(html => markdownContent.innerHTML = html);
    }
}); 