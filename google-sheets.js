document.addEventListener('DOMContentLoaded', () => {
    // Enable debug mode - set to false in production
    const DEBUG = true;
    
    // Debug function to log information
    function debugLog(message, data) {
        if (!DEBUG) return;
        
        console.log(message, data);
        
        // Update debug panel if it exists
        const debugPanel = document.querySelector('.debug-panel');
        if (debugPanel) {
            debugPanel.style.display = 'block';
            const timestamp = new Date().toLocaleTimeString();
            let debugText = `[${timestamp}] ${message}`;
            
            if (data) {
                if (typeof data === 'object') {
                    debugText += ': ' + JSON.stringify(data, null, 2);
                } else {
                    debugText += ': ' + data;
                }
            }
            
            debugPanel.innerHTML += `<div>${debugText}</div>`;
            debugPanel.scrollTop = debugPanel.scrollHeight;
        }
    }
    
    // Show loading indicator
    const loadingElement = document.querySelector('.loading');
    
    // Your Google Sheets information
    const SHEET_ID = '1zZXtHdqkcuOCsz8FMHXMs_B601bF-EGkpnyF98r5Pwg';
    const API_KEY = 'AIzaSyAH8nfE3rAD9BflVyq6abA4urNnzV8UODQ';
    const RANGE = 'Sheet1!A1:J500';
    
    const SHEET_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    
    debugLog('Fetching data from Google Sheets API', SHEET_API_URL);
    
    fetch(SHEET_API_URL)
    .then(response => {
        debugLog('Response status', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        debugLog('Data received', data.values ? `${data.values.length} rows` : 'No values found');
        
        // Hide loading indicator
        if (loadingElement) loadingElement.style.display = 'none';
        
        if (!data.values || data.values.length < 2) {
            throw new Error('No data found in the Google Sheet');
        }
        
        const headers = data.values[0];
        debugLog('Headers', headers);
        
        // Convert to array of objects with header keys
        const jsonData = data.values.slice(1).map(row => {
            const obj = {};
            row.forEach((value, index) => {
                if (index < headers.length) {
                    obj[headers[index]] = value;
                }
            });
            return obj;
        });
        
        debugLog('Parsed JSON Data (first item)', jsonData[0]);
        renderData(jsonData);
    })
    .catch(error => {
        debugLog('Error fetching data', error.message);
        
        if (loadingElement) loadingElement.style.display = 'none';
        
        // Try CSV export as fallback
        tryCSVExport();
    });
    
    // Fallback to CSV export method
    function tryCSVExport() {
        debugLog('Trying CSV export method');
        
        const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
        
        fetch(CSV_URL)
            .then(response => {
                debugLog('CSV Response status', response.status);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return response.text();
            })
            .then(csvText => {
                debugLog('CSV data received', `${csvText.length} characters`);
                
                // Parse the CSV
                const parsedData = parseCSV(csvText);
                debugLog('Parsed CSV Data (first item)', parsedData[0]);
                
                // Hide loading indicator
                if (loadingElement) loadingElement.style.display = 'none';
                
                // Render the data
                renderData(parsedData);
            })
            .catch(error => {
                debugLog('Error with CSV method', error.message);
                
                // Hide loading indicator
                if (loadingElement) loadingElement.style.display = 'none';
                
                // Show error message
                alert('Could not load data from Google Sheets. Please check console for details.');
            });
    }
    
    // Function to parse CSV data
    function parseCSV(csvText) {
        const lines = csvText.split('\n');
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(header => 
            header.replace(/^"|"$/g, '').trim()
        );
        
        const result = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            // Simple parsing (doesn't handle quotes properly but works for basic CSV)
            const values = lines[i].split(',').map(value => 
                value.replace(/^"|"$/g, '').trim()
            );
            
            const obj = {};
            headers.forEach((header, index) => {
                if (index < values.length) {
                    obj[header] = values[index];
                } else {
                    obj[header] = '';
                }
            });
            
            result.push(obj);
        }
        
        return result;
    }
    
    // Function to render data on the page
    function renderData(data) {
        debugLog('Rendering data', `${data.length} items`);
        
        const container = document.querySelector('.interactive-container');
        
        if (!container) {
            debugLog('Error', 'Interactive container not found');
            return;
        }
        
        if (!data || data.length === 0) {
            debugLog('Warning', 'No data to render');
            return;
        }
        
        data.forEach((item, index) => {
            // Skip items without required data
            const imageUrl = item.image;
            if (!imageUrl) {
                debugLog('Skipping item', `Item ${index} has no image URL`);
                return;
            }
            
            debugLog('Creating element for', item.title || item.name || `Item ${index}`);
            
            // Create a container for the item
            const container = document.createElement('div');
            container.className = 'image-container';
            container.style.position = 'absolute';
            container.style.top = item.top || '100px';
            container.style.left = item.left || '100px';
            container.style.width = item.width || '150px';
            
            // Store item data as attributes
            container.dataset.image = imageUrl;
            container.dataset.name = item.name || '';
            container.dataset.title = item.title || item.section || '';
            container.dataset.year = item.year || item.page || '';
            container.dataset.description = item.description || '';
            
            // Create the image element
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = item.name || 'Image';
            
            // Log image loading
            img.onload = () => {
                debugLog('Image loaded successfully', imageUrl);
            };
            
            // Handle image load errors
            img.onerror = () => {
                debugLog('Image failed to load', imageUrl);
                img.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
            };
            
            // Add click event to show modal
            container.addEventListener('click', () => {
                showModal(container);
            });
            
            // Add the image to the container
            container.appendChild(img);
            document.querySelector('.interactive-container').appendChild(container);
        });
        
        // Set up modal functionality
        setupModal();
    }
    
    // Set up modal functionality
    function setupModal() {
        const centerDisplay = document.querySelector('.center-display');
        const closeButton = document.querySelector('.close-button');
        
        if (!centerDisplay || !closeButton) {
            debugLog('Error', 'Modal elements not found');
            return;
        }
        
        // Close when clicking X button
        closeButton.addEventListener('click', () => {
            centerDisplay.style.display = 'none';
        });
        
        // Close when clicking outside content
        centerDisplay.addEventListener('click', (event) => {
            if (event.target === centerDisplay) {
                centerDisplay.style.display = 'none';
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                centerDisplay.style.display = 'none';
            }
        });
        
        debugLog('Modal setup complete');
    }
    
    // Show modal with item details
    function showModal(container) {
        debugLog('Showing modal for', container.dataset.title || container.dataset.name);
        
        const centerDisplay = document.querySelector('.center-display');
        const centerImage = document.getElementById('center-image');
        const centerName = document.getElementById('center-name');
        const centerTitle = document.getElementById('center-title');
        const centerYear = document.getElementById('center-year');
        const centerBody = document.getElementById('center-body');
        
        if (!centerDisplay) {
            debugLog('Error', 'Modal element not found');
            return;
        }
        
        // Get data from container attributes
        const imageUrl = container.dataset.image;
        const name = container.dataset.name;
        const title = container.dataset.title;
        const year = container.dataset.year;
        const description = container.dataset.description;
        
        debugLog('Modal data', { imageUrl, name, title, year });
        
        // Set modal content
        if (centerImage) {
            // Reset any previous error state
            centerImage.classList.remove('image-error');
            
            // Set new image source
            centerImage.src = imageUrl;
            
            // Handle load errors
            centerImage.onerror = () => {
                debugLog('Modal image failed to load', imageUrl);
                centerImage.classList.add('image-error');
                centerImage.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
            };
            
            // Log successful load
            centerImage.onload = () => {
                debugLog('Modal image loaded successfully', imageUrl);
            };
        }
        
        // Set text content
        if (centerName) centerName.textContent = name || '';
        if (centerTitle) centerTitle.textContent = title || '';
        if (centerYear) centerYear.textContent = year || '';
        if (centerBody) centerBody.textContent = description || '';
        
        // Show the modal
        centerDisplay.style.display = 'flex';
    }
    
    // Add click handler for existing text elements
    document.querySelectorAll('div[style*="text-align"]').forEach(element => {
        debugLog('Adding click handler to element', element.textContent);
        
        element.style.cursor = 'pointer';
        
        element.addEventListener('click', () => {
            const title = element.querySelector('span:first-child')?.textContent.replace(/\s*\n\s*/g, '') || '';
            const description = element.querySelector('span:nth-child(2)')?.textContent || '';
            
            debugLog('Text element clicked', { title, description });
            
            // Create dummy container with data
            const container = document.createElement('div');
            container.dataset.name = title;
            container.dataset.title = title;
            container.dataset.year = '';
            container.dataset.description = description;
            container.dataset.image = '';
            
            // Show modal with this data
            showModal(container);
        });
    });
});