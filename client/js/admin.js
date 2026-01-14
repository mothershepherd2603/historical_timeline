document.addEventListener('DOMContentLoaded', function() {
    // API Base URL
    const API_URL = window.API_CONFIG ? window.API_CONFIG.getBaseUrl() : 'http://localhost:3000/api';
    let authToken = null;
    let currentUser = null;
    let periods = [];
    let mediaItems = [];
    
    // Check if user is already logged in
    checkAdminAuth();
    
    function checkAdminAuth() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        
        if (token && user) {
            const userData = JSON.parse(user);
            if (userData.role === 'admin') {
                authToken = token;
                currentUser = userData;
                showAdminPanel();
                initAdmin();
            } else {
                showLoginScreen();
            }
        } else {
            showLoginScreen();
        }
    }
    
    function showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
    }
    
    function showAdminPanel() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
    }
    
    // Admin login handler
    document.getElementById('admin-login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value;
        const errorDiv = document.getElementById('admin-login-error');
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                errorDiv.textContent = data.error || 'Login failed';
                return;
            }
            
            if (data.user.role !== 'admin') {
                errorDiv.textContent = 'Access denied. Admin privileges required.';
                return;
            }
            
            // Store auth token and user info
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Show admin panel
            showAdminPanel();
            initAdmin();
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Network error. Please try again.';
        }
    });
    
    // Initialize admin panel
    function initAdmin() {
        setupEventListeners();
        loadPeriods().then(() => {
            loadEvents();
        });
        loadMedia();
        loadUsers();
        loadSubscriptions();
    }
    
    function setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                switchTab(tabId);
            });
        });
        
        // Event management
        document.getElementById('add-event-btn').addEventListener('click', showAddEventModal);
        document.getElementById('apply-filters').addEventListener('click', applyEventFilters);
        
        // Auto-select period based on year and show/hide date field
        document.getElementById('event-year').addEventListener('input', function() {
            const year = parseInt(this.value);
            if (!isNaN(year)) {
                const matchingPeriod = periods.find(p => year >= p.start_year && year <= p.end_year);
                if (matchingPeriod) {
                    const periodSelect = document.getElementById('event-period');
                    periodSelect.removeAttribute('disabled');
                    periodSelect.value = matchingPeriod.id;
                    
                    // Show date field for Current Affairs (1947+)
                    const dateGroup = document.getElementById('event-date-group');
                    if (year >= 1947) {
                        dateGroup.style.display = 'block';
                    } else {
                        dateGroup.style.display = 'none';
                        document.getElementById('event-date').value = '';
                    }
                }
            }
        });
        
        // Custom tag addition
        document.getElementById('add-custom-tag-btn').addEventListener('click', addCustomTag);
        document.getElementById('custom-tag-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCustomTag();
            }
        });
        
        // Location search
        document.getElementById('search-location-btn').addEventListener('click', searchLocation);
        document.getElementById('event-place-name').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchLocation();
            }
        });
        
        // Period management
        document.getElementById('add-period-btn').addEventListener('click', showAddPeriodModal);
        
        // Media management
        document.getElementById('add-media-btn').addEventListener('click', showAddMediaModal);
        
        // Modal controls
        document.querySelectorAll('.modal .close, .modal .close-period').forEach(closeBtn => {
            closeBtn.addEventListener('click', function() {
                this.closest('.modal').style.display = 'none';
            });
        });
        
        document.getElementById('cancel-event').addEventListener('click', function() {
            document.getElementById('event-modal').style.display = 'none';
        });
        
        document.getElementById('cancel-period').addEventListener('click', function() {
            document.getElementById('period-modal').style.display = 'none';
        });
        
        document.getElementById('cancel-media').addEventListener('click', function() {
            document.getElementById('media-modal').style.display = 'none';
        });
        
        // Form submissions
        document.getElementById('event-form').addEventListener('submit', saveEvent);
        document.getElementById('period-form').addEventListener('submit', savePeriod);
        document.getElementById('media-form').addEventListener('submit', saveMedia);
        
        // Logout
        document.getElementById('logout-btn').addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                authToken = null;
                currentUser = null;
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                showLoginScreen();
            }
        });
    }
    
    function switchTab(tabId) {
        // Update active tab button
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.admin-tab[data-tab="${tabId}"]`).classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');
    }
    
    // Period management functions
    async function loadPeriods() {
        try {
            const response = await fetch(`${API_URL}/periods`);
            const data = await response.json();
            
            if (response.ok) {
                periods = data;
                displayPeriods();
                populatePeriodDropdowns();
            } else {
                console.error('Failed to load periods');
            }
        } catch (error) {
            console.error('Error loading periods:', error);
        }
    }
    
    function displayPeriods() {
        const tableBody = document.querySelector('#periods-table tbody');
        tableBody.innerHTML = '';
        
        periods.forEach(period => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${period.id}</td>
                <td>${period.name}</td>
                <td>${period.start_year}</td>
                <td>${period.end_year}</td>
                <td>${period.requires_subscription ? 'Yes' : 'No'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editPeriod(${period.id})">Edit</button>
                    <button class="action-btn delete-btn" onclick="deletePeriod(${period.id})">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    function populatePeriodDropdowns() {
        const selects = [
            document.getElementById('event-period'),
            document.getElementById('period-filter')
        ];
        
        selects.forEach(select => {
            if (select && select.id !== 'period-filter') {
                select.innerHTML = '';
                periods.forEach(period => {
                    const option = document.createElement('option');
                    option.value = period.id;
                    option.textContent = period.name;
                    select.appendChild(option);
                });
            } else if (select) {
                // Keep "All Periods" option for filter
                const currentValue = select.value;
                select.innerHTML = '<option value="all">All Periods</option>';
                periods.forEach(period => {
                    const option = document.createElement('option');
                    option.value = period.id;
                    option.textContent = period.name;
                    select.appendChild(option);
                });
                select.value = currentValue;
            }
        });
    }
    
    function showAddPeriodModal() {
        document.getElementById('period-modal-title').textContent = 'Add New Period';
        document.getElementById('period-form').reset();
        document.getElementById('period-id').value = '';
        document.getElementById('period-modal').style.display = 'block';
    }
    
    window.editPeriod = async function(periodId) {
        try {
            const period = periods.find(p => p.id === periodId);
            if (!period) return;
            
            document.getElementById('period-modal-title').textContent = 'Edit Period';
            document.getElementById('period-id').value = period.id;
            document.getElementById('period-name').value = period.name;
            document.getElementById('period-start-year').value = period.start_year;
            document.getElementById('period-end-year').value = period.end_year;
            document.getElementById('period-requires-subscription').checked = period.requires_subscription;
            
            document.getElementById('period-modal').style.display = 'block';
        } catch (error) {
            console.error('Error editing period:', error);
            alert('Failed to load period data');
        }
    }
    
    async function savePeriod(e) {
        e.preventDefault();
        
        const periodId = document.getElementById('period-id').value;
        const periodData = {
            name: document.getElementById('period-name').value,
            start_year: parseInt(document.getElementById('period-start-year').value),
            end_year: parseInt(document.getElementById('period-end-year').value),
            requires_subscription: document.getElementById('period-requires-subscription').checked
        };
        
        try {
            const url = periodId ? `${API_URL}/admin/periods/${periodId}` : `${API_URL}/admin/periods`;
            const method = periodId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(periodData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert(`Period "${periodData.name}" saved successfully!`);
                document.getElementById('period-modal').style.display = 'none';
                await loadPeriods();
            } else {
                alert(data.error || 'Failed to save period');
            }
        } catch (error) {
            console.error('Error saving period:', error);
            alert('Network error. Please try again.');
        }
    }
    
    window.deletePeriod = async function(periodId) {
        if (!confirm('Are you sure you want to delete this period?')) return;
        
        try {
            const response = await fetch(`${API_URL}/admin/periods/${periodId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                alert('Period deleted successfully!');
                await loadPeriods();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete period');
            }
        } catch (error) {
            console.error('Error deleting period:', error);
            alert('Network error. Please try again.');
        }
    }
    
    // Event management functions
    async function loadEvents() {
        try {
            const response = await fetch(`${API_URL}/events`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const events = await response.json();
            
            if (response.ok) {
                displayEvents(events);
            } else {
                console.error('Failed to load events');
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }
    
    function displayEvents(events) {
        const tableBody = document.querySelector('#events-table tbody');
        tableBody.innerHTML = '';
        
        events.forEach(event => {
            const row = document.createElement('tr');
            const periodName = periods.find(p => p.id === event.period_id)?.name || 'Unknown';
            const tags = event.tags ? (Array.isArray(event.tags) ? event.tags.join(', ') : event.tags) : '';
            
            row.innerHTML = `
                <td>${event.id}</td>
                <td>${event.title}</td>
                <td>${formatYear(event.year)}</td>
                <td>${periodName}</td>
                <td>${tags}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editEvent(${event.id})">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteEvent(${event.id})">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    function formatYear(year) {
        return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
    }
    
    function applyEventFilters() {
        const period = document.getElementById('period-filter').value;
        const searchTerm = document.getElementById('event-search').value.toLowerCase();
        
        const rows = document.querySelectorAll('#events-table tbody tr');
        
        rows.forEach(row => {
            const rowPeriodId = row.cells[3].textContent;
            const rowText = row.textContent.toLowerCase();
            
            const periodMatch = period === 'all' || rowPeriodId.includes(periods.find(p => p.id == period)?.name || '');
            const searchMatch = searchTerm === '' || rowText.includes(searchTerm);
            
            row.style.display = periodMatch && searchMatch ? '' : 'none';
        });
    }
    
    function showAddEventModal() {
        document.getElementById('event-modal-title').textContent = 'Add New Event';
        document.getElementById('event-form').reset();
        document.getElementById('event-id').value = '';
        document.getElementById('event-period').removeAttribute('disabled');
        // Clear all tag checkboxes
        document.querySelectorAll('#event-tags-container input[type="checkbox"]').forEach(cb => cb.checked = false);
        // Clear custom tags
        document.getElementById('custom-tags-display').innerHTML = '';
        document.getElementById('custom-tag-input').value = '';
        // Hide date field by default
        document.getElementById('event-date-group').style.display = 'none';
        document.getElementById('event-date').value = '';
        populateMediaSelect();
        document.getElementById('event-modal').style.display = 'block';
    }
    
    // Add custom tag function
    function addCustomTag() {
        const input = document.getElementById('custom-tag-input');
        const tagValue = input.value.trim().toLowerCase();
        
        if (!tagValue) {
            alert('Please enter a tag name');
            return;
        }
        
        // Check if tag already exists (in predefined or custom)
        const existingPredefined = Array.from(document.querySelectorAll('#event-tags-container input[type="checkbox"]'))
            .some(cb => cb.value === tagValue);
        const existingCustom = Array.from(document.querySelectorAll('#custom-tags-display .custom-tag'))
            .some(tag => tag.dataset.tagValue === tagValue);
        
        if (existingPredefined || existingCustom) {
            alert('This tag already exists');
            return;
        }
        
        // Create custom tag element
        const tagElement = document.createElement('span');
        tagElement.className = 'custom-tag';
        tagElement.dataset.tagValue = tagValue;
        tagElement.innerHTML = `
            ${tagValue}
            <button type="button" class="remove-tag" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.getElementById('custom-tags-display').appendChild(tagElement);
        input.value = '';
    }
    
    // Location search using Nominatim (OpenStreetMap) geocoding API
    async function searchLocation() {
        const placeName = document.getElementById('event-place-name').value.trim();
        const resultsContainer = document.getElementById('location-search-results');
        
        if (!placeName) {
            alert('Please enter a place name');
            return;
        }
        
        try {
            // Show loading state
            resultsContainer.innerHTML = '<div style="padding: 1rem; text-align: center;">Searching...</div>';
            resultsContainer.classList.add('active');
            
            // Call Nominatim API (OpenStreetMap)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=5`, {
                headers: {
                    'User-Agent': 'HistoricalTimelineApp/1.0' // Required by Nominatim
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch location data');
            }
            
            const results = await response.json();
            
            if (results.length === 0) {
                resultsContainer.innerHTML = '<div style="padding: 1rem; color: #e74c3c;">No locations found. Try a different search term.</div>';
                return;
            }
            
            // Display results
            resultsContainer.innerHTML = '';
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'location-result-item';
                resultItem.innerHTML = `
                    <div class="location-name">${result.display_name.split(',')[0]}</div>
                    <div class="location-details">${result.display_name}</div>
                    <div class="location-details">Lat: ${parseFloat(result.lat).toFixed(4)}, Lng: ${parseFloat(result.lon).toFixed(4)}</div>
                `;
                resultItem.addEventListener('click', () => selectLocation(result));
                resultsContainer.appendChild(resultItem);
            });
            
        } catch (error) {
            console.error('Geocoding error:', error);
            resultsContainer.innerHTML = '<div style="padding: 1rem; color: #e74c3c;">Error searching for location. Please try again.</div>';
        }
    }
    
    // Select a location from search results
    function selectLocation(result) {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        // Set latitude and longitude fields
        document.getElementById('event-lat').value = lat.toFixed(6);
        document.getElementById('event-lng').value = lng.toFixed(6);
        
        // Update place name field with the selected location
        document.getElementById('event-place-name').value = result.display_name.split(',')[0];
        
        // Hide results
        document.getElementById('location-search-results').classList.remove('active');
        document.getElementById('location-search-results').innerHTML = '';
    }

    window.editEvent = async function(eventId) {
        try {
            const response = await fetch(`${API_URL}/events/${eventId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const event = await response.json();
            
            if (!response.ok) {
                alert('Failed to load event');
                return;
            }
            
            document.getElementById('event-modal-title').textContent = 'Edit Event';
            document.getElementById('event-id').value = event.id;
            document.getElementById('event-title').value = event.title || '';
            document.getElementById('event-year').value = event.year || '';
            document.getElementById('event-period').value = event.period_id || '';
            document.getElementById('event-period').removeAttribute('disabled');
            document.getElementById('event-place-name').value = event.place_name || '';
            document.getElementById('event-lat').value = event.latitude || '';
            document.getElementById('event-lng').value = event.longitude || '';
            
            // Show/hide date field based on year
            const dateGroup = document.getElementById('event-date-group');
            if (event.year >= 1947) {
                dateGroup.style.display = 'block';
                // Populate date if available
                if (event.date) {
                    const dateObj = new Date(event.date);
                    document.getElementById('event-date').value = dateObj.toISOString().split('T')[0];
                } else {
                    document.getElementById('event-date').value = '';
                }
            } else {
                dateGroup.style.display = 'none';
                document.getElementById('event-date').value = '';
            }
            
            // Clear custom tags display
            document.getElementById('custom-tags-display').innerHTML = '';
            
            // Get all predefined tag values
            const predefinedTagValues = Array.from(document.querySelectorAll('#event-tags-container input[type="checkbox"]'))
                .map(cb => cb.value);
            
            // Set tag checkboxes and identify custom tags
            if (event.tags && Array.isArray(event.tags)) {
                event.tags.forEach(tag => {
                    if (predefinedTagValues.includes(tag)) {
                        // Check the predefined checkbox
                        const checkbox = document.querySelector(`#event-tags-container input[value="${tag}"]`);
                        if (checkbox) checkbox.checked = true;
                    } else {
                        // Add as custom tag
                        const tagElement = document.createElement('span');
                        tagElement.className = 'custom-tag';
                        tagElement.dataset.tagValue = tag;
                        tagElement.innerHTML = `
                            ${tag}
                            <button type="button" class="remove-tag" onclick="this.parentElement.remove()">&times;</button>
                        `;
                        document.getElementById('custom-tags-display').appendChild(tagElement);
                    }
                });
            }
            
            document.getElementById('event-summary').value = event.summary || event.description || '';
            
            populateMediaSelect(event.media_ids);
            document.getElementById('event-modal').style.display = 'block';
        } catch (error) {
            console.error('Error loading event:', error);
            alert('Failed to load event');
        }
    }
    
    async function saveEvent(e) {
        e.preventDefault();
        
        console.log('Save event triggered');
        
        const eventId = document.getElementById('event-id').value;
        
        // Get selected tags from checkboxes
        const predefinedTags = Array.from(document.querySelectorAll('#event-tags-container input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        // Get custom tags
        const customTags = Array.from(document.querySelectorAll('#custom-tags-display .custom-tag'))
            .map(tag => tag.dataset.tagValue);
        
        // Combine all tags
        const tags = [...predefinedTags, ...customTags];
        
        const mediaIds = Array.from(document.getElementById('event-media').selectedOptions).map(opt => opt.value);
        
        const eventData = {
            title: document.getElementById('event-title').value,
            summary: document.getElementById('event-summary').value,
            description: document.getElementById('event-summary').value,
            year: parseInt(document.getElementById('event-year').value),
            period_id: document.getElementById('event-period').value,
            latitude: parseFloat(document.getElementById('event-lat').value) || null,
            longitude: parseFloat(document.getElementById('event-lng').value) || null,
            tags: tags,
            media_ids: mediaIds
        };
        
        // Add date if provided (for Current Affairs)
        const eventDate = document.getElementById('event-date').value;
        if (eventDate) {
            eventData.date = new Date(eventDate);
        }
        
        console.log('Event data:', eventData);
        
        try {
            const url = eventId ? `${API_URL}/admin/events/${eventId}` : `${API_URL}/admin/events`;
            const method = eventId ? 'PUT' : 'POST';
            
            console.log('Sending request to:', url, 'Method:', method);
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(eventData)
            });
            
            const data = await response.json();
            console.log('Response:', data);
            
            if (response.ok) {
                alert(`Event "${eventData.title}" saved successfully!`);
                document.getElementById('event-modal').style.display = 'none';
                loadEvents();
            } else {
                alert(data.error || 'Failed to save event');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Network error. Please try again.');
        }
    }
    
    window.deleteEvent = async function(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        try {
            const response = await fetch(`${API_URL}/admin/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                alert('Event deleted successfully!');
                loadEvents();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Network error. Please try again.');
        }
    }
    
    // Media management functions
    async function loadMedia() {
        try {
            const response = await fetch(`${API_URL}/admin/media`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const media = await response.json();
            
            if (response.ok) {
                mediaItems = media;
                displayMedia(media);
            } else {
                console.error('Failed to load media');
            }
        } catch (error) {
            console.error('Error loading media:', error);
        }
    }
    
    function displayMedia(media) {
        const mediaGrid = document.querySelector('.media-grid');
        mediaGrid.innerHTML = '';
        
        media.forEach(item => {
            const mediaElement = document.createElement('div');
            mediaElement.className = 'media-item';
            
            let preview = '';
            if (item.type === 'image') {
                preview = `<img src="${item.url}" alt="${item.caption}">`;
            } else if (item.type === 'video') {
                preview = `<video controls><source src="${item.url}" type="video/mp4"></video>`;
            } else if (item.type === 'audio') {
                preview = `<audio controls><source src="${item.url}" type="audio/mpeg"></audio>`;
            }
            
            mediaElement.innerHTML = `
                ${preview}
                <p><strong>${item.caption}</strong></p>
                <p>${item.type.toUpperCase()}</p>
                <div class="media-actions">
                    <button class="delete-media action-btn delete-btn" onclick="deleteMedia(${item.id})">Delete</button>
                </div>
            `;
            
            mediaGrid.appendChild(mediaElement);
        });
    }
    
    function populateMediaSelect(selectedIds = []) {
        const mediaSelect = document.getElementById('event-media');
        mediaSelect.innerHTML = '';
        
        mediaItems.forEach(media => {
            const option = document.createElement('option');
            option.value = media.id;
            option.textContent = `${media.caption} (${media.type})`;
            option.selected = selectedIds.includes(media.id);
            mediaSelect.appendChild(option);
        });
    }
    
    function showAddMediaModal() {
        document.getElementById('media-modal-title').textContent = 'Upload Media';
        document.getElementById('media-form').reset();
        document.getElementById('media-id').value = '';
        document.getElementById('media-modal').style.display = 'block';
    }
    
    async function saveMedia(e) {
        e.preventDefault();
        
        const type = document.getElementById('media-type').value;
        const caption = document.getElementById('media-caption').value;
        const description = document.getElementById('media-description').value;
        const fileInput = document.getElementById('media-file');
        
        // In a real application, you would upload the file to a server
        // For now, we'll use a placeholder URL
        const url = `assets/${type}s/${fileInput.files[0]?.name || 'placeholder.jpg'}`;
        
        const mediaData = {
            type: type,
            url: url,
            caption: caption,
            description: description
        };
        
        try {
            const response = await fetch(`${API_URL}/admin/media`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(mediaData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Media uploaded successfully!');
                document.getElementById('media-modal').style.display = 'none';
                loadMedia();
            } else {
                alert(data.error || 'Failed to upload media');
            }
        } catch (error) {
            console.error('Error uploading media:', error);
            alert('Network error. Please try again.');
        }
    }
    
    window.deleteMedia = async function(mediaId) {
        if (!confirm('Are you sure you want to delete this media item?')) return;
        
        try {
            const response = await fetch(`${API_URL}/admin/media/${mediaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                alert('Media deleted successfully!');
                loadMedia();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete media');
            }
        } catch (error) {
            console.error('Error deleting media:', error);
            alert('Network error. Please try again.');
        }
    }
    
    // User management functions
    async function loadUsers() {
        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const users = await response.json();
            
            if (response.ok) {
                displayUsers(users);
            } else {
                console.error('Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    function displayUsers(users) {
        const tableBody = document.querySelector('#users-table tbody');
        tableBody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>-</td>
                <td>
                    <button class="action-btn" disabled>View</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Subscription management functions
    async function loadSubscriptions() {
        try {
            const [statsResponse, listResponse] = await Promise.all([
                fetch(`${API_URL}/admin/subscriptions/stats`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                }),
                fetch(`${API_URL}/admin/subscriptions`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                })
            ]);
            
            const stats = await statsResponse.json();
            const subscriptions = await listResponse.json();
            
            if (statsResponse.ok) {
                document.getElementById('total-subscribers').textContent = stats.total_subscribers;
                document.getElementById('monthly-revenue').textContent = `₹${stats.monthly_revenue.toFixed(2)}`;
            }
            
            if (listResponse.ok) {
                displaySubscriptions(subscriptions);
            }
        } catch (error) {
            console.error('Error loading subscriptions:', error);
        }
    }
    
    function displaySubscriptions(subscriptions) {
        const tableBody = document.querySelector('#subscriptions-table tbody');
        tableBody.innerHTML = '';
        
        subscriptions.forEach(sub => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sub.username}</td>
                <td>${sub.plan_name}</td>
                <td>${new Date(sub.start_date).toLocaleDateString()}</td>
                <td>${new Date(sub.end_date).toLocaleDateString()}</td>
                <td><span class="status-badge active">Active</span></td>
            `;
            tableBody.appendChild(row);
        });
    }
});
