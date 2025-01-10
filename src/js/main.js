// Format date helper function
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

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
        const response = await fetch('blog/posts.json');
        if (!response.ok) throw new Error('Failed to load posts');
        const posts = await response.json();

        // Display the latest 3 posts
        const postsHtml = posts.slice(0, 3).map(post => `
            <article>
                <h3><a href="blog/${post.slug}.html">${post.title}</a></h3>
                <div class="post-meta">
                    <time datetime="${post.date}">${formatDate(new Date(post.date))}</time>
                    ${post.tags ? `<div class="tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                </div>
                <div class="post-excerpt">${post.excerpt}</div>
                <a href="blog/${post.slug}.html">Read more →</a>
            </article>
        `).join('');

        latestPostsElement.innerHTML = postsHtml;
    } catch (error) {
        console.error('Error loading blog posts:', error);
        latestPostsElement.innerHTML = '<p>Error loading posts</p>';
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

// Chart.js configuration
document.addEventListener('DOMContentLoaded', function () {
    // Set default Chart.js colors and styles
    Chart.defaults.color = '#fff';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

    // Main chart
    const mainCtx = document.getElementById('mainChart').getContext('2d');
    const mainChart = new Chart(mainCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
            datasets: [{
                label: 'Performance',
                data: [30, 45, 35, 50, 40, 60, 55, 70, 65],
                borderColor: '#4834E4',
                backgroundColor: 'rgba(72, 52, 228, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    border: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    });

    // Secondary chart
    const secondaryCtx = document.getElementById('secondaryChart').getContext('2d');
    const secondaryChart = new Chart(secondaryCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Growth',
                data: [20, 35, 25, 45, 30, 55],
                borderColor: '#6B5EE5',
                backgroundColor: 'rgba(107, 94, 229, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    border: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
}); 