// Comprehensive API Test - Mimics client behavior exactly
const API_BASE = 'https://historical-timeline-a223.onrender.com/api';

async function testSubscribeFlow() {
    console.log('=== Testing Subscribe Flow (Client Simulation) ===\n');
    
    // Step 1: Register a test user
    console.log('1. Registering test user...');
    try {
        const registerRes = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `testuser_${Date.now()}`,
                email: `test_${Date.now()}@example.com`,
                password: 'TestPass123!'
            })
        });
        
        console.log('   Status:', registerRes.status);
        if (registerRes.ok) {
            const userData = await registerRes.json();
            console.log('   ✅ User registered:', userData.username);
        } else {
            const error = await registerRes.json();
            console.log('   ⚠️  Error:', error);
        }
    } catch (err) {
        console.log('   ❌ Error:', err.message);
        return;
    }
    
    // Step 2: Login
    console.log('\n2. Logging in...');
    let token = null;
    try {
        const loginRes = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'testuser',
                password: 'testpass'
            })
        });
        
        console.log('   Status:', loginRes.status);
        if (loginRes.ok) {
            const loginData = await loginRes.json();
            token = loginData.token;
            console.log('   ✅ Login successful, token received');
        } else {
            const error = await loginRes.json();
            console.log('   ⚠️  Login failed (expected for new test user):', error.error);
        }
    } catch (err) {
        console.log('   ❌ Error:', err.message);
    }
    
    // Step 3: Try to create order WITHOUT authentication (should fail)
    console.log('\n3. Testing create-order WITHOUT auth (should return 401)...');
    try {
        const orderRes = await fetch(`${API_BASE}/subscribe/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: 'monthly' })
        });
        
        console.log('   Status:', orderRes.status);
        const contentType = orderRes.headers.get('content-type');
        console.log('   Content-Type:', contentType);
        
        if (orderRes.status === 404) {
            console.log('   ❌ ERROR: Got 404 - Route not found!');
            console.log('   This means the route is not deployed on Render');
        } else if (orderRes.status === 401) {
            console.log('   ✅ CORRECT: Got 401 - Authentication required');
            const error = await orderRes.json();
            console.log('   Error message:', error);
        } else {
            const data = await orderRes.text();
            console.log('   Response:', data);
        }
    } catch (err) {
        console.log('   ❌ Error:', err.message);
    }
    
    // Step 4: Try with authentication (if we have a token)
    if (token) {
        console.log('\n4. Testing create-order WITH auth...');
        try {
            const orderRes = await fetch(`${API_BASE}/subscribe/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan: 'monthly' })
            });
            
            console.log('   Status:', orderRes.status);
            const data = await orderRes.json();
            console.log('   Response:', data);
            
            if (orderRes.ok) {
                console.log('   ✅ Order created successfully');
            }
        } catch (err) {
            console.log('   ❌ Error:', err.message);
        }
    }
    
    // Step 5: List all available API routes
    console.log('\n5. Testing other API endpoints to verify server is working...');
    const endpoints = [
        { method: 'GET', path: '/periods', desc: 'Get periods' },
        { method: 'GET', path: '/events', desc: 'Get events' },
        { method: 'GET', path: '/health', desc: 'Health check' },
    ];
    
    for (const endpoint of endpoints) {
        try {
            const res = await fetch(`${API_BASE}${endpoint.path}`);
            const status = res.ok ? '✅' : '❌';
            console.log(`   ${status} ${endpoint.method} ${endpoint.path} - Status: ${res.status}`);
        } catch (err) {
            console.log(`   ❌ ${endpoint.method} ${endpoint.path} - Error: ${err.message}`);
        }
    }
    
    console.log('\n=== Test Complete ===');
    console.log('\nConclusion:');
    console.log('- If you see "404 - Route not found" for /subscribe/create-order:');
    console.log('  → You need to DEPLOY the updated code to Render');
    console.log('  → Run: git add . && git commit -m "Fix routes" && git push');
    console.log('  → Then redeploy on Render dashboard');
    console.log('');
    console.log('- If you see "401 - Authentication required":');
    console.log('  → ✅ The route is working correctly!');
    console.log('  → The 404 you saw earlier was likely a temporary issue or cache');
}

testSubscribeFlow();
