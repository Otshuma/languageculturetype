document.addEventListener('DOMContentLoaded', () => {
    // Show loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingElement);

    // Use your existing Google Sheets information
    const SHEET_ID = '1zZXtHdqkcuOCsz8FMHXMs_B601bF-EGkpnyF98r5Pwg';
    const API_KEY = 'AIzaSyAH8nfE3rAD9BflVyq6abA4urNnzV8UODQ';
    const RANGE = 'Sheet1!A1:J500'; // Using your existing Sheet1

    const SHEET_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

    fetch(SHEET_API_URL)
    .then(response => {
        // Check if the response is okay (status 200)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json(); // Parse response as JSON
    })
    .then(data => {
        // Hide loading indicator
        document.querySelector('.loading').style.display = 'none';

        const rows = data.values; // Extract the rows from the data
        if (!rows || rows.length === 0) {
            console.error('No data found in the Google Sheet');
            return;
        }

        const headers = rows[0]; // First row contains headers (column names)
        
        // Convert the remaining rows into an array of objects
        const jsonData = rows.slice(1).map(row => {
            const obj = {};
            row.forEach((value, index) => {
                if (index < headers.length) {
                    obj[headers[index]] = value; // Map column headers to corresponding row values
                }
            });
            return obj;
        });

        console.log('Parsed JSON Data:', jsonData); // Log the structured data for debugging
        renderData(jsonData); // Call function to display the data on the webpage
    })
    .catch(error => {
        console.error('Error fetching data:', error); // Handle any fetch errors
        document.querySelector('.loading').style.display = 'none';
        
        // Show error message to user
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = 'Error loading data. Please try again later.';
        document.body.appendChild(errorElement);
    });

    /**
     * Function to render the fetched data as selectable content
     */
    function renderData(data) {
        const interactiveContainer = document.querySelector('.interactive-container');
        
        // Create center display elements if they don't exist
        if (!document.querySelector('.center-display')) {
            createCenterDisplay();
        }
        
        const centerDisplay = document.querySelector('.center-display');
        const centerContent = document.querySelector('.center-content');

        // Check if interactive container exists
        if (!interactiveContainer) {
            console.error('Interactive container not found');
            return;
        }

        data.forEach(item => {
            // Handle any missing properties by using empty strings or defaults
            const section = item.section || '';
            const page = item.page || '';
            const description = item.description || '';
            const top = item.top || '0';
            const left = item.left || '0';
            const image = item.image || '';
            const name = item.name || '';
            const title = item.title || section || '';
            const classes = item.classes || 'image-container';
            const width = item.width || '200px';

            // Skip items without required properties based on your data structure
            if (!image || !image.trim()) {
                console.warn('Skipping item due to missing image:', item);
                return;
            }

            // Create a div container for the item
            const container = document.createElement('div');
            container.className = classes;
            container.style.position = 'absolute';
            container.style.top = `${parseFloat(top) || 0}px`;
            container.style.left = `${parseFloat(left) || 0}px`;
            container.style.width = width;

            // Store metadata as data attributes
            container.setAttribute('data-name', name);
            container.setAttribute('data-title', title);
            container.setAttribute('data-year', page);
            container.setAttribute('data-description', description);

            // Create an image element
            const img = document.createElement('img');
            img.src = image.trim();
            img.alt = title || 'Image';

            // Handle image load errors by replacing with a placeholder
            img.onerror = () => {
                console.error('Failed to load image:', img.src);
                img.src = 'https://via.placeholder.com/150';
            };

            // Append image to container and container to the interactive area
            container.appendChild(img);
            interactiveContainer.appendChild(container);
        });

        // Add event listener to handle clicks on images
        interactiveContainer.addEventListener('click', (event) => {
            const container = event.target.closest('.image-container');
            if (container) {
                displayCenterInfo(container);
            }
        });

        // Click event to hide the center display when clicked outside content
        if (centerDisplay && centerContent) {
            centerDisplay.addEventListener('click', (event) => {
                if (event.target === centerDisplay) {
                    centerDisplay.style.display = 'none';
                }
            });
            
            // Close button functionality
            const closeButton = document.querySelector('.close-button');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    centerDisplay.style.display = 'none';
                });
            }
        }
    }

    /**
     * Function to create the center display modal if it doesn't exist
     */
    function createCenterDisplay() {
        // Create center display element
        const centerDisplay = document.createElement('div');
        centerDisplay.className = 'center-display';
        
        // Create center content element
        const centerContent = document.createElement('div');
        centerContent.className = 'center-content';
        
        // Create close button
        const closeButton = document.createElement('div');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '&times;';
        
        // Create center elements
        const centerImage = document.createElement('img');
        centerImage.id = 'center-image';
        centerImage.alt = 'Selected item';
        
        const centerName = document.createElement('h2');
        centerName.id = 'center-name';
        
        const centerTitle = document.createElement('h3');
        centerTitle.id = 'center-title';
        
        const centerYear = document.createElement('p');
        centerYear.id = 'center-year';
        
        const centerBody = document.createElement('p');
        centerBody.id = 'center-body';
        
        // Append elements to center content
        centerContent.appendChild(closeButton);
        centerContent.appendChild(centerImage);
        centerContent.appendChild(centerName);
        centerContent.appendChild(centerTitle);
        centerContent.appendChild(centerYear);
        centerContent.appendChild(centerBody);
        
        // Append center content to center display
        centerDisplay.appendChild(centerContent);
        
        // Append center display to body
        document.body.appendChild(centerDisplay);
        
        // Add CSS for center display if not already defined
        if (!document.querySelector('style')) {
            addModalStyles();
        }
    }

    /**
     * Function to add CSS styles for the modal if not already defined
     */
    function addModalStyles() {
        const styles = `
            .loading {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(255, 255, 255, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
            }
            
            .loading-spinner {
                border: 6px solid #f3f3f3;
                border-top: 6px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .error-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #f8d7da;
                color: #721c24;
                padding: 20px;
                border-radius: 5px;
                text-align: center;
                z-index: 2000;
            }
            
            .image-container {
                position: absolute;
                cursor: pointer;
                transition: transform 0.3s ease;
                z-index: 1;
            }
            
            .image-container:hover {
                transform: scale(1.05);
            }
            
            .image-container img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .center-display {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .center-content {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 80%;
                max-height: 80%;
                overflow-y: auto;
                position: relative;
            }
            
            .close-button {
                position: absolute;
                top: 10px;
                right: 10px;
                font-size: 24px;
                cursor: pointer;
            }
            
            #center-image {
                max-width: 100%;
                max-height: 50vh;
                display: block;
                margin: 0 auto 20px auto;
            }
            
            #center-name {
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            #center-title {
                font-size: 20px;
                margin-bottom: 10px;
                color: #555;
            }
            
            #center-year {
                font-size: 16px;
                margin-bottom: 20px;
                color: #777;
            }
            
            #center-body {
                line-height: 1.6;
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    /**
     * Function to display detailed information in the center display area
     */
    function displayCenterInfo(container) {
        // Select elements for displaying detailed information
        const centerImage = document.getElementById('center-image');
        const centerName = document.getElementById('center-name');
        const centerTitle = document.getElementById('center-title');
        const centerYear = document.getElementById('center-year');
        const centerBody = document.getElementById('center-body');
        const centerDisplay = document.querySelector('.center-display');

        // Check if center display exists
        if (!centerDisplay) {
            console.error('Center display not found');
            return;
        }

        // Get the image URL
        const imageUrl = container.querySelector('img')?.src || '';

        // Check if all elements exist before setting content
        if (centerImage) centerImage.src = imageUrl;
        if (centerName) centerName.textContent = container.getAttribute('data-name') || '';
        if (centerTitle) centerTitle.textContent = container.getAttribute('data-title') || '';
        if (centerYear) centerYear.textContent = container.getAttribute('data-year') || '';
        if (centerBody) centerBody.textContent = container.getAttribute('data-description') || '';

        // Show the center display
        centerDisplay.style.display = 'flex';
    }
});