// Store uploaded files in memory (this is temporary storage)
const uploadedFiles = {
    grammar: [],
    vocabulary: [],
    speaking: [],
    writing: [],
    'lesson-plans': [],
    worksheets: []
};

// Initialize modal elements if they exist
const modal = document.getElementById('pdf-modal');
const closeButton = document.querySelector('.close-button');
const pdfPreviewContainer = document.getElementById('pdf-preview-container');

// Only set up modal events if elements exist
if (modal && closeButton && pdfPreviewContainer) {
    // Close modal when clicking the close button or outside the modal
    closeButton.onclick = () => {
        modal.style.display = 'none';
        // Clear the container when closing
        pdfPreviewContainer.innerHTML = '<canvas id="pdf-preview"></canvas>';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            // Clear the container when closing
            pdfPreviewContainer.innerHTML = '<canvas id="pdf-preview"></canvas>';
        }
    };
}

// Function to show PDF preview
async function showPDFPreview(url) {
    const pdfPreviewCanvas = document.getElementById('pdf-preview');
    modal.style.display = 'block';

    try {
        // Show loading state
        pdfPreviewContainer.innerHTML = '<div class="loading">Loading PDF...</div>';

        // Load the PDF
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        // Get the first page
        const page = await pdf.getPage(1);
        
        // Calculate scale to fit the container width
        const desiredWidth = pdfPreviewContainer.clientWidth - 40; // Account for padding
        const viewport = page.getViewport({ scale: 1.0 });
        const scale = desiredWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        // Prepare canvas
        pdfPreviewContainer.innerHTML = '<canvas id="pdf-preview"></canvas>';
        const canvas = document.getElementById('pdf-preview');
        const context = canvas.getContext('2d');

        // Set canvas dimensions
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Render PDF page
        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport
        };

        await page.render(renderContext);
    } catch (error) {
        console.error('Error loading PDF:', error);
        pdfPreviewContainer.innerHTML = '<div class="error">Error loading PDF. Please try again.</div>';
    }
}

// Function to load files for a specific category
async function loadFiles(category) {
    const container = document.getElementById(`${category}-files`);
    if (!container) return;

    try {
        // Set loading state
        container.innerHTML = '<p class="no-files">Loading files...</p>';

        // Fetch the file list from the server
        const response = await fetch(`/materials/${category}/`);
        const text = await response.text();
        
        // Parse the directory listing HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const links = Array.from(doc.querySelectorAll('a')).filter(a => a.href.endsWith('/') === false);
        
        // Clear the container
        container.innerHTML = '';

        if (links.length === 0) {
            container.innerHTML = '<p class="no-files">No files available</p>';
            return;
        }

        // Create file items
        links.forEach(link => {
            const fileName = decodeURIComponent(link.href.split('/').pop());
            const filePath = `/materials/${category}/${fileName}`;
            const isPDF = fileName.toLowerCase().endsWith('.pdf');
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileNameSpan = document.createElement('span');
            fileNameSpan.className = 'file-name';
            fileNameSpan.textContent = fileName;
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';

            if (isPDF) {
                const previewButton = document.createElement('button');
                previewButton.className = 'preview-button';
                previewButton.textContent = 'Preview';
                previewButton.onclick = () => showPDFPreview(filePath);
                buttonContainer.appendChild(previewButton);
            }
            
            const downloadLink = document.createElement('a');
            downloadLink.href = filePath;
            downloadLink.className = 'download-button';
            downloadLink.download = fileName;
            downloadLink.textContent = 'Download';
            buttonContainer.appendChild(downloadLink);
            
            fileItem.appendChild(fileNameSpan);
            fileItem.appendChild(buttonContainer);
            container.appendChild(fileItem);
        });

        // Add material-section class to the parent section if not already present
        const parentSection = container.closest('section');
        if (parentSection && !parentSection.classList.contains('material-section')) {
            parentSection.classList.add('material-section');
        }

    } catch (error) {
        console.error(`Error loading ${category} files:`, error);
        container.innerHTML = '<p class="no-files">Error loading files</p>';
    }
}

// Function to create file list
function createFileList(files, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    if (files.length === 0) {
        container.innerHTML = '<p class="no-files">No files available yet</p>';
        return;
    }

    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const downloadLink = document.createElement('a');
        downloadLink.href = file.path;
        downloadLink.className = 'download-button';
        downloadLink.download = file.name;
        downloadLink.textContent = 'Download';
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(downloadLink);
        container.appendChild(fileItem);
    });
}

function handleFileUpload(input, category) {
    const files = Array.from(input.files);
    
    files.forEach(file => {
        // Create object URL for the file
        const fileUrl = URL.createObjectURL(file);
        uploadedFiles[category].push({
            name: file.name,
            url: fileUrl
        });
    });

    // Update the display
    displayFiles(category);
}

function displayFiles(category) {
    const container = document.getElementById(`${category}-files`);
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    const files = uploadedFiles[category];
    if (files.length === 0) {
        container.innerHTML = '<p class="no-files">No files available yet</p>';
        return;
    }

    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const downloadLink = document.createElement('a');
        downloadLink.href = file.url;
        downloadLink.className = 'download-button';
        downloadLink.download = file.name;
        downloadLink.textContent = 'Download';
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteFile(category, file.name);
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(downloadLink);
        fileItem.appendChild(deleteButton);
        container.appendChild(fileItem);
    });
}

function deleteFile(category, fileName) {
    uploadedFiles[category] = uploadedFiles[category].filter(file => file.name !== fileName);
    displayFiles(category);
}

// Function to refresh all material sections
async function refreshAllMaterials() {
    const categories = ['grammar', 'vocabulary', 'speaking', 'writing', 'lesson-plans', 'worksheets'];
    await Promise.all(categories.map(category => loadFiles(category)));
}

// Function to filter materials based on search term
function filterMaterials(searchTerm) {
    console.log('Starting filterMaterials with term:', searchTerm);
    
    // Only try to filter if we're on the materials page
    if (!window.location.pathname.includes('materials.html')) {
        console.log('Not on materials page, returning');
        return;
    }

    const materialSections = document.querySelectorAll('.material-section');
    console.log('Found material sections:', materialSections.length);
    
    if (!materialSections.length) {
        console.log('No material sections found, search might be too early');
        return;
    }

    searchTerm = searchTerm.toLowerCase();
    let totalMatches = 0;
    let matchingSections = new Set();

    // Remove existing search results summary
    const existingSummary = document.querySelector('.search-results-summary');
    if (existingSummary) {
        existingSummary.remove();
    }

    // Function to highlight matching text
    function highlightText(text, term) {
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    // Function to check if file matches search
    function checkFileMatch(fileItem, term) {
        const fileNameEl = fileItem.querySelector('.file-name');
        const fileName = fileNameEl.textContent.toLowerCase();
        
        // Remove existing highlights
        fileItem.classList.remove('search-match');
        fileNameEl.innerHTML = fileNameEl.textContent;

        if (fileName.includes(term)) {
            fileItem.classList.add('search-match');
            fileNameEl.innerHTML = highlightText(fileNameEl.textContent, term);
            return true;
        }
        return false;
    }

    // Process each section
    materialSections.forEach(section => {
        const sectionTitle = section.querySelector('h2').textContent;
        const filesContainer = section.querySelector('.files-container');
        const fileItems = filesContainer.querySelectorAll('.file-item');
        console.log(`Processing section: ${sectionTitle}, found ${fileItems.length} files`);
        
        let sectionMatches = 0;

        fileItems.forEach(fileItem => {
            if (checkFileMatch(fileItem, searchTerm)) {
                sectionMatches++;
                totalMatches++;
                matchingSections.add(sectionTitle);
            }
        });

        // Show/hide empty message
        const noFilesMessage = filesContainer.querySelector('.no-files');
        if (noFilesMessage) {
            noFilesMessage.style.display = sectionMatches === 0 ? '' : 'none';
        }

        // Show/hide sections based on matches
        section.style.display = sectionMatches > 0 ? '' : 'none';
    });

    // Create and display search results summary
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'search-results-summary';
    
    if (totalMatches > 0) {
        const sectionsList = Array.from(matchingSections).join(', ');
        summaryDiv.innerHTML = `
            Found <span class="count">${totalMatches}</span> matching ${totalMatches === 1 ? 'file' : 'files'} 
            in <span class="count">${matchingSections.size}</span> ${matchingSections.size === 1 ? 'section' : 'sections'}: 
            <span class="count">${sectionsList}</span>
        `;
    } else {
        summaryDiv.innerHTML = `
            <div class="no-results-message">
                No files found matching "${searchTerm}". Try a different search term.
            </div>
        `;
    }

    // Insert summary after the page header
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
        pageHeader.insertAdjacentElement('afterend', summaryDiv);
    }

    // Scroll to first match if any
    const firstMatch = document.querySelector('.search-match');
    if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    console.log(`Search complete. Found ${totalMatches} matches in ${matchingSections.size} sections`);
}

// Function to show/hide loading indicator
function toggleSearchLoading(show) {
    let loadingEl = document.querySelector('.search-loading');
    if (show) {
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.className = 'search-loading';
            loadingEl.innerHTML = 'Searching...';
            const pageHeader = document.querySelector('.page-header');
            if (pageHeader) {
                pageHeader.insertAdjacentElement('afterend', loadingEl);
            }
        }
        loadingEl.style.display = 'block';
    } else if (loadingEl) {
        loadingEl.remove();
    }
}

// Initialize search functionality - this will work on any page
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    if (!searchInput || !searchButton) return;

    function performSearch(e) {
        if (e) e.preventDefault();
        
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm === '') return;

        // If on home page, just redirect with search term
        if (!window.location.pathname.includes('materials.html')) {
            window.location.href = `materials.html?search=${encodeURIComponent(searchTerm)}`;
            return;
        }

        // If on materials page, perform search
        filterMaterials(searchTerm);
    }

    // Add event listeners
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(e);
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    initializeSearch();
    
    // If on materials page
    if (window.location.pathname.includes('materials.html')) {
        console.log('On materials page, loading materials');
        // Load the materials first
        await refreshAllMaterials();
        console.log('Materials loaded');
        
        // Check for search parameter
        const urlParams = new URLSearchParams(window.location.search);
        const searchTerm = urlParams.get('search');
        
        if (searchTerm) {
            console.log('Found search term in URL:', searchTerm);
            const decodedTerm = decodeURIComponent(searchTerm);
            // Set the search input value
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = decodedTerm;
                console.log('Set search input value');
            }
            
            // Show loading indicator
            toggleSearchLoading(true);
            
            // Wait a bit longer before searching
            console.log('Waiting before performing search...');
            setTimeout(() => {
                console.log('Performing search after delay');
                filterMaterials(decodedTerm);
                toggleSearchLoading(false);
            }, 50); // Reduced to 500ms delay
        }
    }
});

// Re-initialize search when navigating back/forward
window.addEventListener('popstate', () => {
    initializeSearch();
    
    if (window.location.pathname.includes('materials.html')) {
        refreshAllMaterials();
        
        const urlParams = new URLSearchParams(window.location.search);
        const searchTerm = urlParams.get('search');
        
        if (searchTerm) {
            setTimeout(() => handleSearch(searchTerm), 500);
        }
    }
});
