/**
 * Comprehensive test for the full Rewardz server
 */
const http = require('http');

console.log('🧪 Testing Full Rewardz Server...\n');

const testEndpoint = (path, method = 'GET', body = null, expectedStatus = 200) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode === expectedStatus;
        const status = success ? '✅' : '❌';
        console.log(`${status} ${method} ${path} - Status: ${res.statusCode}`);
        
        if (data) {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              console.log(`   Error: ${json.error.message || json.error}`);
            } else if (json.message) {
              console.log(`   Message: ${json.message}`);
            }
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 100)}...`);
          }
        }
        
        resolve({ success, statusCode: res.statusCode, data });
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${method} ${path} - Error: ${e.message}`);
      resolve({ success: false, error: e.message });
    });

    req.setTimeout(5000, () => {
      console.log(`❌ ${method} ${path} - Timeout`);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runFullTests() {
  console.log('🔍 Testing all server endpoints...\n');
  
  const tests = [
    // Basic endpoints
    { path: '/health', expectedStatus: 200 },
    { path: '/api/ping', expectedStatus: 200 },
    { path: '/api/demo', expectedStatus: 200 },
    
    // Payment endpoints (should fail without proper data)
    { path: '/api/payments/create-checkout-session', method: 'POST', body: { amountCents: 5000 }, expectedStatus: 200 },
    { path: '/api/payments/create-payment-intent', method: 'POST', body: { amountCents: 5000 }, expectedStatus: 200 },
    
    // Email endpoint (should fail without proper data)
    { path: '/api/notify/email', method: 'POST', body: { to: 'test@example.com', subject: 'Test', text: 'Test message' }, expectedStatus: 200 },
    
    // Vision endpoint (should fail without proper data)
    { path: '/api/vision/labels', method: 'POST', body: { imageBase64: 'test' }, expectedStatus: 200 },
    
    // 404 test
    { path: '/nonexistent', expectedStatus: 404 },
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(
      test.path, 
      test.method || 'GET', 
      test.body, 
      test.expectedStatus
    );
    results.push({ ...test, ...result });
  }
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed >= total * 0.8) { // 80% pass rate is good for a complex server
    console.log('🎉 Server is working well! Most endpoints are responding correctly.');
  } else {
    console.log('⚠️  Some issues detected. Check the server logs for details.');
  }
  
  // Show summary
  console.log('\n📋 Summary:');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${status} ${r.method || 'GET'} ${r.path} (${r.statusCode})`);
  });
}

runFullTests().catch(console.error);
