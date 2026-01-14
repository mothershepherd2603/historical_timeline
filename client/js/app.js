document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let currentPeriod = 'ancient';
    let currentYear = 0; // Default to year 0
    let currentDate = null; // For Current Affairs date selection
    let isSubscribed = false;
    let authToken = null;
    let currentUser = null;
    let map;
    let markers = [];
    let allEvents = [];
    let selectedEvent = null;
    let currentTagFilter = []; // Array to store multiple selected tags
    let currentLocationFilter = null; // Currently selected location
    
    // API Base URL - Uses dynamic configuration from config.js
    const API_URL = window.API_CONFIG ? window.API_CONFIG.getBaseUrl() : 'http://localhost:3000/api';
    
    // Indian cities and coordinates
    const locations = [
        { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
        { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
        { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
        { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
        { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
        { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
        { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
        { name: 'Pune', lat: 18.5204, lng: 73.8567 },
        { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
        { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
        { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
        { name: 'Agra', lat: 27.1767, lng: 78.0081 },
        { name: 'Patna', lat: 25.5941, lng: 85.1376 },
        { name: 'Surat', lat: 21.1702, lng: 72.8311 },
        { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
        { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
        { name: 'Indore', lat: 22.7196, lng: 75.8577 },
        { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
        { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
        { name: 'Kochi', lat: 9.9312, lng: 76.2673 }
    ];
    
    // Check for stored auth token on load
    function checkAuth() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        
        if (token && user) {
            authToken = token;
            currentUser = JSON.parse(user);
            updateAuthUI();
            checkSubscriptionStatus();
        }
    }
    
    // Initialize map
    function initMap() {
        map = L.map('map').setView([20.5937, 78.9629], 5); // Center on India
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }
    
    // Initialize the application
    function init() {
        checkAuth();
        initMap();
        populateLocationDropdown();
        setupEventListeners();
        updatePeriod(currentPeriod);
    }
    
    // Populate location dropdown
    function populateLocationDropdown() {
        const locationSelect = document.getElementById('location-select');
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.name;
            option.textContent = location.name;
            locationSelect.appendChild(option);
        });
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Period selector buttons
        document.querySelectorAll('.period-btn').forEach(button => {
            button.addEventListener('click', function() {
                const period = this.dataset.period;
                updatePeriod(period);
            });
        });
        
        // Year input
        document.getElementById('year-input').addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                goToYear();
            }
        });
        
        // Date input (for Current Affairs)
        document.getElementById('date-input').addEventListener('change', function() {
            if (currentPeriod === 'current') {
                goToDate();
            }
        });
        
        // Go button
        document.getElementById('go-btn').addEventListener('click', function() {
            if (currentPeriod === 'current' && document.getElementById('date-input').value) {
                goToDate();
            } else {
                goToYear();
            }
        });
        
        // Slider
        document.getElementById('timeline-slider').addEventListener('input', function() {
            const year = parseInt(this.value);
            document.getElementById('current-year').textContent = formatYear(year);
            document.getElementById('year-input').value = year; // Sync with input field
            currentYear = year;
            checkYearAccess();
        });
        
        // Tag filter - handled by dynamically created checkboxes
        // Event listeners will be attached when checkboxes are created
        
        // Location selector
        document.getElementById('location-select').addEventListener('change', function() {
            const selectedLocation = this.value;
            if (selectedLocation) {
                currentLocationFilter = locations.find(loc => loc.name === selectedLocation);
            } else {
                currentLocationFilter = null;
            }
            displayFilteredEvents();
        });
        
        // Clear selection button
        document.getElementById('clear-selection-btn').addEventListener('click', function() {
            selectedEvent = null;
            currentLocationFilter = null;
            document.getElementById('location-select').value = '';
            displayFilteredEvents();
        });
        
        // Reset year button
        document.getElementById('reset-year-btn').addEventListener('click', function() {
            currentYear = 0;
            document.getElementById('year-input').value = 0;
            document.getElementById('current-year').textContent = formatYear(0);
            const slider = document.getElementById('timeline-slider');
            if (0 >= parseInt(slider.min) && 0 <= parseInt(slider.max)) {
                slider.value = 0;
            }
            checkYearAccess();
        });
        
        // Login Modal
        const loginModal = document.getElementById('login-modal');
        const registerModal = document.getElementById('register-modal');
        const subscriptionModal = document.getElementById('subscription-modal');
        
        document.querySelector('.close-login').addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
        
        document.querySelector('.close-register').addEventListener('click', () => {
            registerModal.style.display = 'none';
        });
        
        document.querySelector('.close-subscription').addEventListener('click', () => {
            subscriptionModal.style.display = 'none';
        });
        
        // Switch between login and register
        document.getElementById('show-register').addEventListener('click', () => {
            loginModal.style.display = 'none';
            registerModal.style.display = 'block';
        });
        
        document.getElementById('show-login').addEventListener('click', () => {
            registerModal.style.display = 'none';
            loginModal.style.display = 'block';
        });
        
        // Form submissions
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('register-form').addEventListener('submit', handleRegister);
        
        // Subscription plans
        document.querySelectorAll('.subscribe-plan').forEach(button => {
            button.addEventListener('click', function() {
                const plan = this.dataset.plan;
                const price = this.dataset.price;
                handleSubscription(plan, price);
            });
        });
        
        // Auth buttons
        document.getElementById('login-btn').addEventListener('click', showLogin);
        document.getElementById('subscribe-btn').addEventListener('click', showSubscription);
        
        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) loginModal.style.display = 'none';
            if (e.target === registerModal) registerModal.style.display = 'none';
            if (e.target === subscriptionModal) subscriptionModal.style.display = 'none';
        });
    }
    
    // Update the selected period
    function updatePeriod(period) {
        // Check if subscription is needed (skip for admin users)
        const isAdmin = currentUser && currentUser.role === 'admin';
        if ((period === 'medieval' || period === 'modern' || period === 'current') && !isSubscribed && !isAdmin) {
            document.getElementById('subscription-modal').style.display = 'block';
            return;
        }
        
        // Update UI
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.period-btn[data-period="${period}"]`).classList.add('active');
        
        currentPeriod = period;
        
        // Update slider range based on period
        const slider = document.getElementById('timeline-slider');
        const minYear = document.getElementById('min-year');
        const maxYear = document.getElementById('max-year');
        
        switch(period) {
            case 'ancient':
                slider.min = -3000;
                slider.max = 500;
                slider.value = -1500;
                minYear.textContent = '3000 BCE';
                maxYear.textContent = '500 CE';
                break;
            case 'medieval':
                slider.min = 500;
                slider.max = 1500;
                slider.value = 1000;
                minYear.textContent = '500 CE';
                maxYear.textContent = '1500 CE';
                break;
            case 'modern':
                slider.min = 1500;
                slider.max = 1947;
                slider.value = 1750;
                minYear.textContent = '1500 CE';
                maxYear.textContent = '1947 CE';
                break;
            case 'current':
                slider.min = 1947;
                slider.max = new Date().getFullYear();
                slider.value = 2000;
                minYear.textContent = '1947 CE';
                maxYear.textContent = `${new Date().getFullYear()} CE`;
                break;
        }
        
        // Show/hide date picker based on period
        const dateInput = document.getElementById('date-input');
        const yearInput = document.getElementById('year-input');
        if (period === 'current') {
            dateInput.style.display = 'inline-block';
            yearInput.placeholder = 'Year (optional)';
        } else {
            dateInput.style.display = 'none';
            dateInput.value = '';
            yearInput.placeholder = 'Enter year (e.g., 1500)';
        }
        
        // Reset to show year 0 by default
        currentYear = 0;
        currentDate = null;
        document.getElementById('current-year').textContent = formatYear(0);
        currentTagFilter = [];
        
        // Update year input to 0
        document.getElementById('year-input').value = 0;
        
        // Update slider to 0 if within range
        if (0 >= parseInt(slider.min) && 0 <= parseInt(slider.max)) {
            slider.value = 0;
        }
        
        // Load events for year 0
        loadYearData(0);
    }
    
    // Go to the specified year
    function goToYear() {
        const yearInput = document.getElementById('year-input');
        const year = parseInt(yearInput.value);
        
        if (!isNaN(year)) {
            const slider = document.getElementById('timeline-slider');
            
            // Check if year is within current period range
            if (year >= parseInt(slider.min) && year <= parseInt(slider.max)) {
                slider.value = year; // Update slider position
                currentYear = year;
                currentDate = null; // Clear date when selecting by year
                document.getElementById('date-input').value = ''; // Clear date input
                document.getElementById('current-year').textContent = formatYear(year);
                checkYearAccess();
            } else {
                alert(`Year ${year} is not in the ${currentPeriod} period range.`);
            }
        } else {
            alert('Please enter a valid year');
        }
    }
    
    // Go to the specified date (for Current Affairs)
    function goToDate() {
        const dateInput = document.getElementById('date-input');
        const selectedDate = dateInput.value;
        
        if (selectedDate) {
            const date = new Date(selectedDate);
            const year = date.getFullYear();
            
            currentDate = selectedDate;
            currentYear = year;
            
            // Update year input to match selected date
            document.getElementById('year-input').value = year;
            document.getElementById('current-year').textContent = formatYear(year);
            
            // Update slider
            const slider = document.getElementById('timeline-slider');
            if (year >= parseInt(slider.min) && year <= parseInt(slider.max)) {
                slider.value = year;
            }
            
            checkYearAccess();
        } else {
            alert('Please select a date');
        }
    }
    
    // Check if year requires subscription
    async function checkYearAccess() {
        // Check if admin user
        const isAdmin = currentUser && currentUser.role === 'admin';
        
        // Ancient period is always free
        if (currentPeriod === 'ancient') {
            await loadYearData(currentYear);
            return;
        }
        
        // Other periods require subscription (unless admin)
        if (!isSubscribed && !isAdmin) {
            document.getElementById('subscription-modal').style.display = 'block';
        } else {
            await loadYearData(currentYear);
        }
    }
    
    // Load data for a specific year or all events in period
    async function loadYearData(year) {
        try {
            // Show loading indicator
            document.getElementById('event-summary').innerHTML = '<p>Loading events...</p>';
            
            // Fetch events from API
            const headers = {};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            // Define period ranges
            const periodMap = {
                'ancient': { start: -3000, end: 500 },
                'medieval': { start: 500, end: 1500 },
                'modern': { start: 1500, end: 1947 },
                'current': { start: 1947, end: 9999 }
            };
            const currentRange = periodMap[currentPeriod];
            
            // Fetch all events for the entire period (not just specific year)
            const startYear = currentRange.start;
            const endYear = currentRange.end;
            
            // No limit - we need all events for the period
            let url = `${API_URL}/events?start_year=${startYear}&end_year=${endYear}`;
            
            // Add date parameter for Current Affairs
            if (currentPeriod === 'current' && currentDate) {
                url += `&date=${currentDate}`;
            }
            
            const response = await fetch(url, {
                headers: headers
            });
            
            allEvents = [];
            if (response.ok) {
                allEvents = await response.json();
                // Filter events to only current period
                allEvents = allEvents.filter(e => e.year >= currentRange.start && e.year <= currentRange.end);
            }
            
            // Update tag filter dropdown
            updateTagFilter();
            
            // Reset selection
            selectedEvent = null;
            
            // Display events
            displayFilteredEvents();
            
        } catch (error) {
            console.error('Error loading events:', error);
            // Show error message
            document.getElementById('event-summary').innerHTML = `<p>Error loading events. Please try again later.</p>`;
            document.getElementById('event-tags').innerHTML = '';
            document.getElementById('media-container').innerHTML = '';
        }
    }
    
    // Update tag filter with checkboxes for available tags
    function updateTagFilter() {
        const allTags = [...new Set(allEvents.flatMap(e => e.tags || []))];
        const tagFilterContainer = document.getElementById('tag-filter-container');
        const previousSelections = [...currentTagFilter]; // Save current selections
        
        tagFilterContainer.innerHTML = '';
        
        // Add "All Tags" checkbox
        const allDiv = document.createElement('div');
        allDiv.className = 'tag-checkbox-item';
        allDiv.innerHTML = `
            <input type="checkbox" id="tag-all" value="all" ${currentTagFilter.length === 0 ? 'checked' : ''}>
            <label for="tag-all">All Tags</label>
        `;
        tagFilterContainer.appendChild(allDiv);
        
        // Add checkbox for each tag
        allTags.forEach(tag => {
            const div = document.createElement('div');
            div.className = 'tag-checkbox-item';
            const checked = previousSelections.includes(tag) ? 'checked' : '';
            div.innerHTML = `
                <input type="checkbox" id="tag-${tag}" value="${tag}" ${checked}>
                <label for="tag-${tag}">${tag.charAt(0).toUpperCase() + tag.slice(1)}</label>
            `;
            tagFilterContainer.appendChild(div);
        });
        
        // Add event listeners to all checkboxes
        tagFilterContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (this.value === 'all') {
                    // If "All Tags" is checked, uncheck others
                    if (this.checked) {
                        currentTagFilter = [];
                        tagFilterContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                            if (cb.value !== 'all') cb.checked = false;
                        });
                    }
                } else {
                    // Uncheck "All Tags" when any specific tag is selected
                    document.getElementById('tag-all').checked = false;
                    
                    // Update currentTagFilter array
                    if (this.checked) {
                        if (!currentTagFilter.includes(this.value)) {
                            currentTagFilter.push(this.value);
                        }
                    } else {
                        currentTagFilter = currentTagFilter.filter(t => t !== this.value);
                        // If no tags selected, check "All Tags"
                        if (currentTagFilter.length === 0) {
                            document.getElementById('tag-all').checked = true;
                        }
                    }
                }
                displayFilteredEvents();
            });
        });
    }
    
    // Display filtered events
    function displayFilteredEvents() {
        let eventsToDisplay = allEvents;
        
        // Filter by year (always showing single year)
        eventsToDisplay = eventsToDisplay.filter(e => e.year === currentYear);
        
        // Filter by tags if any are selected (applies to entire period)
        // Show events that have ANY of the selected tags (OR condition)
        if (currentTagFilter.length > 0) {
            eventsToDisplay = eventsToDisplay.filter(e => 
                e.tags && e.tags.some(tag => currentTagFilter.includes(tag))
            );
        }
        
        // Filter by location if selected (within ~3 degrees radius)
        if (currentLocationFilter) {
            eventsToDisplay = eventsToDisplay.filter(e => {
                if (!e.latitude || !e.longitude) return false;
                const distance = Math.sqrt(
                    Math.pow(e.latitude - currentLocationFilter.lat, 2) + 
                    Math.pow(e.longitude - currentLocationFilter.lng, 2)
                );
                return distance <= 3; // Within ~3 degrees (~330km radius)
            });
            
            // Center map on selected location
            map.setView([currentLocationFilter.lat, currentLocationFilter.lng], 7);
        }
        
        // Sort events by year
        eventsToDisplay.sort((a, b) => a.year - b.year);
        
        // Update UI title
        let titleText;
        if (selectedEvent) {
            titleText = `${selectedEvent.title} (${formatYear(selectedEvent.year)})`;
        } else {
            titleText = `Events in ${formatYear(currentYear)}`;
        }
        document.getElementById('event-title').textContent = titleText;
        
        // Clear previous markers
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        
        if (eventsToDisplay.length > 0) {
            // Add new markers for events with location data
            eventsToDisplay.forEach(event => {
                if (event.latitude && event.longitude) {
                    const marker = L.marker([event.latitude, event.longitude]).addTo(map);
                    
                    // Popup with event details
                    marker.bindPopup(`<b>${event.title}</b><br>${formatYear(event.year)}<br>${event.summary || event.description}`);
                    
                    // Click event to show only this event
                    marker.on('click', function() {
                        selectedEvent = event;
                        displayFilteredEvents();
                    });
                    
                    markers.push(marker);
                    
                    // If this is the selected event, open its popup and center map
                    if (selectedEvent && event.id === selectedEvent.id) {
                        marker.openPopup();
                        map.setView([event.latitude, event.longitude], 8);
                    }
                }
            });
            
            // Fit map to show all markers if multiple events and no selection
            if (markers.length > 1 && !selectedEvent) {
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.1));
            } else if (markers.length === 1 && !selectedEvent) {
                // If only one marker and no selection, center on it
                const singleEvent = eventsToDisplay.find(e => e.latitude && e.longitude);
                if (singleEvent) {
                    map.setView([singleEvent.latitude, singleEvent.longitude], 6);
                }
            }
            
            // Update summary with actual events
            const summaryContainer = document.getElementById('event-summary');
            summaryContainer.innerHTML = eventsToDisplay.map(event => {
                const tagsHtml = event.tags && event.tags.length > 0 
                    ? `<div class="event-tags">${event.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
                    : '';
                
                // Format date for Current Affairs events
                let dateDisplay = formatYear(event.year);
                if (currentPeriod === 'current' && event.date) {
                    const eventDate = new Date(event.date);
                    dateDisplay = eventDate.toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    });
                }
                
                return `<div class="event-item ${selectedEvent && event.id === selectedEvent.id ? 'selected' : ''}" data-event-id="${event.id}">
                    <h3>${event.title} (${dateDisplay})</h3>
                    ${tagsHtml}
                    <p>${event.summary || event.description}</p>
                </div>`;
            }).join('');
            
            // Add click handlers to event items
            document.querySelectorAll('.event-item').forEach(item => {
                item.addEventListener('click', function() {
                    const eventId = this.dataset.eventId;
                    const clickedEvent = eventsToDisplay.find(e => e.id === eventId);
                    if (clickedEvent) {
                        selectedEvent = clickedEvent;
                        displayFilteredEvents();
                        
                        // Center map on selected event if it has coordinates
                        if (clickedEvent.latitude && clickedEvent.longitude) {
                            map.setView([clickedEvent.latitude, clickedEvent.longitude], 8);
                        }
                    }
                });
            });
            
            // Clear the global tags container (tags are now shown per event)
            document.getElementById('event-tags').innerHTML = '';
            
            // Update media (if events have media)
            const mediaContainer = document.getElementById('media-container');
            mediaContainer.innerHTML = '';
        } else {
            // No events found, show placeholder
            const message = `No events found for ${formatYear(currentYear)} in this period.`;
            document.getElementById('event-summary').innerHTML = `<p>${message} Try a different year or add events through the admin panel.</p>`;
            document.getElementById('event-tags').innerHTML = '';
            document.getElementById('media-container').innerHTML = '';
        }
    }
    
    // Fallback to mock data
    function loadMockData(year) {
        const mockData = getMockData(year);
        
        // Update UI
        document.getElementById('event-title').textContent = `Events in ${formatYear(year)}`;
        
        // Clear previous markers
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        
        // Add new markers
        mockData.events.forEach(event => {
            const marker = L.marker([event.lat, event.lng]).addTo(map)
                .bindPopup(`<b>${event.title}</b><br>${event.summary}`);
            
            markers.push(marker);
        });
        
        // Update summary
        const summaryContainer = document.getElementById('event-summary');
        summaryContainer.innerHTML = mockData.summary;
        
        // Update tags
        const tagsContainer = document.getElementById('event-tags');
        tagsContainer.innerHTML = mockData.tags.map(tag => 
            `<span class="tag">${tag}</span>`
        ).join('');
        
        // Update media
        const mediaContainer = document.getElementById('media-container');
        mediaContainer.innerHTML = mockData.media.map(media => {
            if (media.type === 'image') {
                return `<img src="${media.url}" alt="${media.caption}" class="media-item" onerror="this.style.display='none'">`;
            } else if (media.type === 'video') {
                return `<video controls class="media-item"><source src="${media.url}" type="video/mp4">${media.caption}</video>`;
            } else if (media.type === 'audio') {
                return `<audio controls class="media-item"><source src="${media.url}" type="audio/mpeg">${media.caption}</audio>`;
            }
        }).join('');
    }
    
    // Format year for display
    function formatYear(year) {
        return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
    }
    
    // Mock data function - in a real app, this would come from the backend
    function getMockData(year) {
        // This is simplified mock data
        if (currentPeriod === 'ancient') {
            return {
                summary: `<p>The ${formatYear(year)} was a significant period in ancient Indian history. The Indus Valley Civilization was flourishing, with advanced urban planning and trade networks.</p>
                          <p>Key developments during this time include the composition of early Vedic texts and the establishment of early agricultural practices.</p>`,
                tags: ['history', 'cultural', 'archaeology'],
                events: [
                    {
                        title: 'Indus Valley City',
                        summary: 'Major urban center with advanced drainage systems',
                        lat: 23.9628,
                        lng: 71.0204
                    },
                    {
                        title: 'Vedic Settlement',
                        summary: 'Early Aryan settlements along the Saraswati river',
                        lat: 29.5,
                        lng: 76.5
                    }
                ],
                media: [
                    {
                        type: 'image',
                        url: 'assets/indus-valley.jpg',
                        caption: 'Indus Valley ruins'
                    }
                ]
            };
        } else if (currentPeriod === 'medieval') {
            return {
                summary: `<p>The ${formatYear(year)} saw the rise of powerful medieval kingdoms in India. The Delhi Sultanate was establishing its rule, while regional powers like the Vijayanagara Empire were flourishing in the south.</p>
                          <p>This period was marked by significant architectural achievements and cultural synthesis.</p>`,
                tags: ['history', 'political', 'architecture'],
                events: [
                    {
                        title: 'Delhi Sultanate Court',
                        summary: 'Center of administration for the Delhi Sultanate',
                        lat: 28.6139,
                        lng: 77.2090
                    },
                    {
                        title: 'Vijayanagara Capital',
                        summary: 'Capital of the powerful Vijayanagara Empire',
                        lat: 15.3350,
                        lng: 76.4620
                    }
                ],
                media: [
                    {
                        type: 'image',
                        url: 'assets/vijayanagara.jpg',
                        caption: 'Vijayanagara ruins'
                    }
                ]
            };
        } else if (currentPeriod === 'modern') {
            return {
                summary: `<p>In ${formatYear(year)}, India was under colonial rule but also seeing the beginnings of the independence movement. The British East India Company was consolidating power while Indian reformers were laying the groundwork for future resistance.</p>
                          <p>This period saw significant economic changes and the introduction of modern education systems.</p>`,
                tags: ['history', 'political', 'economic'],
                events: [
                    {
                        title: 'British Presidency',
                        summary: 'Seat of British colonial administration',
                        lat: 22.5726,
                        lng: 88.3639
                    },
                    {
                        title: 'Reformer\'s Birthplace',
                        summary: 'Birthplace of key Indian social reformers',
                        lat: 18.5204,
                        lng: 73.8567
                    }
                ],
                media: [
                    {
                        type: 'image',
                        url: 'assets/british-india.jpg',
                        caption: 'British colonial buildings'
                    }
                ]
            };
        } else { // current
            return {
                summary: `<p>The year ${formatYear(year)} in India was marked by significant political, economic, and social developments. India continued to emerge as a global power while addressing domestic challenges.</p>
                          <p>Key events included economic reforms, technological advancements, and important diplomatic engagements.</p>`,
                tags: ['political', 'economic', 'technology'],
                events: [
                    {
                        title: 'National Capital',
                        summary: 'Center of government and political activity',
                        lat: 28.6139,
                        lng: 77.2090
                    },
                    {
                        title: 'Tech Hub',
                        summary: 'Growing center of technology and innovation',
                        lat: 12.9716,
                        lng: 77.5946
                    }
                ],
                media: [
                    {
                        type: 'image',
                        url: 'assets/modern-india.jpg',
                        caption: 'Modern Indian cityscape'
                    },
                    {
                        type: 'video',
                        url: 'assets/india-progress.mp4',
                        caption: 'India\'s progress video'
                    }
                ]
            };
        }
    }
    
    // Subscription functions
    function showLogin() {
        if (currentUser) {
            // Already logged in, show logout option
            if (confirm(`Logged in as ${currentUser.username}. Do you want to logout?`)) {
                handleLogout();
            }
        } else {
            document.getElementById('login-modal').style.display = 'block';
            document.getElementById('login-error').textContent = '';
        }
    }
    
    function showSubscription() {
        if (!currentUser) {
            alert('Please login first to subscribe');
            showLogin();
            return;
        }
        
        if (isSubscribed) {
            alert('You already have an active subscription!');
            return;
        }
        
        document.getElementById('subscription-modal').style.display = 'block';
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        
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
            
            // Store auth token and user info
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateAuthUI();
            document.getElementById('login-modal').style.display = 'none';
            document.getElementById('login-form').reset();
            errorDiv.textContent = '';
            
            // Check subscription status
            await checkSubscriptionStatus();
            
            alert(`Welcome back, ${currentUser.username}!`);
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Network error. Please try again.';
        }
    }
    
    async function handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const errorDiv = document.getElementById('register-error');
        const successDiv = document.getElementById('register-success');
        
        errorDiv.textContent = '';
        successDiv.textContent = '';
        
        // Validate passwords match
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            return;
        }
        
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters';
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                errorDiv.textContent = data.error || 'Registration failed';
                return;
            }
            
            // Show success message
            successDiv.textContent = 'Registration successful! Please login.';
            document.getElementById('register-form').reset();
            
            // Automatically switch to login after 2 seconds
            setTimeout(() => {
                document.getElementById('register-modal').style.display = 'none';
                document.getElementById('login-modal').style.display = 'block';
                successDiv.textContent = '';
            }, 2000);
        } catch (error) {
            console.error('Registration error:', error);
            errorDiv.textContent = 'Network error. Please try again.';
        }
    }
    
    async function handleSubscription(plan, price) {
        console.log('handleSubscription called with plan:', plan, 'price:', price);
        
        if (!currentUser) {
            alert('Please login first');
            document.getElementById('subscription-modal').style.display = 'none';
            showLogin();
            return;
        }
        
        try {
            console.log('Creating Razorpay order...');
            // Create Razorpay order
            const orderResponse = await fetch(`${API_URL}/subscribe/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ plan })
            });
            
            const orderData = await orderResponse.json();
            console.log('Order response:', orderData);
            
            if (!orderResponse.ok) {
                alert(orderData.error || 'Failed to create order');
                return;
            }
            
            console.log('Opening Razorpay checkout...');
            // Open Razorpay checkout
            const options = {
                key: orderData.razorpay_key,
                amount: orderData.amount,
                currency: 'INR',
                name: 'Historical Timeline',
                description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
                order_id: orderData.order_id,
                handler: async function (response) {
                    // Verify payment on backend
                    try {
                        const verifyResponse = await fetch(`${API_URL}/subscribe/verify-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                plan: plan
                            })
                        });
                        
                        const verifyData = await verifyResponse.json();
                        
                        if (!verifyResponse.ok) {
                            alert(verifyData.error || 'Payment verification failed');
                            return;
                        }
                        
                        isSubscribed = true;
                        document.getElementById('subscription-modal').style.display = 'none';
                        updateAuthUI();
                        alert(`Successfully subscribed to ${plan} plan! You now have access to all premium content.`);
                        
                        // Reload the current period with subscription access
                        updatePeriod(currentPeriod);
                    } catch (error) {
                        console.error('Verification error:', error);
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: currentUser.username,
                    email: currentUser.email || ''
                },
                theme: {
                    color: '#3399cc'
                }
            };
            
            console.log('Razorpay options:', options);
            
            if (typeof Razorpay === 'undefined') {
                console.error('Razorpay is not loaded!');
                alert('Payment system not loaded. Please refresh the page.');
                return;
            }
            
            const rzp = new Razorpay(options);
            console.log('Razorpay instance created');
            
            rzp.on('payment.failed', function (response) {
                console.error('Payment failed:', response);
                alert('Payment failed: ' + response.error.description);
            });
            
            console.log('Opening Razorpay modal...');
            rzp.open();
            console.log('Razorpay modal opened');
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Network error. Please try again.');
        }
    }
    
    function handleLogout() {
        authToken = null;
        currentUser = null;
        isSubscribed = false;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        updateAuthUI();
        
        // Reset to ancient period (free)
        updatePeriod('ancient');
        
        alert('You have been logged out');
    }
    
    async function checkSubscriptionStatus() {
        if (!authToken) return;
        
        try {
            const response = await fetch(`${API_URL}/subscription/status`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                isSubscribed = data.isActive || false;
                updateAuthUI();
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    }
    
    function updateAuthUI() {
        const loginBtn = document.getElementById('login-btn');
        const subscribeBtn = document.getElementById('subscribe-btn');
        
        if (currentUser) {
            loginBtn.textContent = currentUser.username;
            loginBtn.style.backgroundColor = '#27ae60';
            
            if (isSubscribed) {
                subscribeBtn.textContent = 'Premium Member';
                subscribeBtn.style.backgroundColor = '#f39c12';
                subscribeBtn.disabled = true;
            } else {
                subscribeBtn.textContent = 'Subscribe';
                subscribeBtn.style.backgroundColor = '#e74c3c';
                subscribeBtn.disabled = false;
            }
        } else {
            loginBtn.textContent = 'Login';
            loginBtn.style.backgroundColor = '#3498db';
            subscribeBtn.textContent = 'Subscribe';
            subscribeBtn.style.backgroundColor = '#e74c3c';
            subscribeBtn.disabled = false;
        }
    }
    
    function subscribe(plan) {
        alert(`Subscribing to ${plan} plan. Payment processing would be implemented here.`);
        isSubscribed = true;
        document.getElementById('subscription-modal').style.display = 'none';
        updatePeriod(currentPeriod); // Reload with subscription
    }
    
    // Initialize the app
    init();
});