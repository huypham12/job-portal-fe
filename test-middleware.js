// Test middleware by calling API directly
const testAPI = async () => {
  console.log('Testing API calls...');

  const token = localStorage.getItem('authToken');
  if (!token) {
    console.log('❌ No auth token found');
    return;
  }

  try {
    // Test debug endpoint first
    console.log('1. Testing debug endpoint...');
    const debugResponse = await fetch('http://localhost:4002/api/applications/debug-user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const debugData = await debugResponse.json();
    console.log('Debug response:', debugResponse.status, debugData);

    if (!debugResponse.ok) {
      console.log('❌ Debug endpoint failed - authentication problem');
      return;
    }

    // Test job stats endpoint
    console.log('2. Testing job stats endpoint...');
    const statsResponse = await fetch('http://localhost:4002/api/applications/job/070591fc-b592-4b0e-acb8-bf16fe0502e4/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const statsData = await statsResponse.json();
    console.log('Stats response:', statsResponse.status, statsData);

    if (statsResponse.ok) {
      console.log('✅ Job stats endpoint works!');
    } else {
      console.log('❌ Job stats endpoint failed:', statsData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testAPI();
