// Test script to verify API endpoints
const API_BASE = 'https://historical-timeline-a223.onrender.com';

async function testEndpoints() {
    console.log('Testing API Endpoints...\n');
    
    // Test 1: Health Check
    try {
        console.log('1. Testing /health endpoint...');
        const healthRes = await fetch(`${API_BASE}/health`);
        const healthData = await healthRes.json();
        console.log('   ✅ Status:', healthRes.status);
        console.log('   Response:', healthData);
    } catch (err) {
        console.log('   ❌ Error:', err.message);
    }
    
    // Test 2: API Health Check
    try {
        console.log('\n2. Testing /api/health endpoint...');
        const apiHealthRes = await fetch(`${API_BASE}/api/health`);
        const apiHealthData = await apiHealthRes.json();
        console.log('   ✅ Status:', apiHealthRes.status);
        console.log('   Response:', apiHealthData);
    } catch (err) {
        console.log('   ❌ Error:', err.message);
    }
    
    // Test 3: Get Periods
    try {
        console.log('\n3. Testing /api/periods endpoint...');
        const periodsRes = await fetch(`${API_BASE}/api/periods`);
        const periodsData = await periodsRes.json();
        console.log('   ✅ Status:', periodsRes.status);
        console.log('   Periods found:', periodsData.length || 0);
    } catch (err) {
        console.log('   ❌ Error:', err.message);
    }
    
    // Test 4: Subscribe Create Order (should fail without auth)
    try {
        console.log('\n4. Testing /api/subscribe/create-order endpoint (no auth)...');
        const orderRes = await fetch(`${API_BASE}/api/subscribe/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: 'monthly' })
        });
        console.log('   Status:', orderRes.status);
        if (orderRes.status === 401) {
            console.log('   ✅ Correctly requires authentication');
        } else {
            const data = await orderRes.json();
            console.log('   Response:', data);
        }
    } catch (err) {
        console.log('   ❌ Error:', err.message);
    }
    
    console.log('\n✅ Testing complete!');
}

testEndpoints();
