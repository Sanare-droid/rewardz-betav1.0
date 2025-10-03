/**
 * Debug script to test server functionality
 */
const http = require('http');

console.log('🔍 Testing server endpoints...\n');

const testEndpoint = (path, expectedStatus = 200) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode === expectedStatus;
        console.log(`${success ? '✅' : '❌'} ${path} - Status: ${res.statusCode}`);
        if (!success) {
          console.log(`   Expected: ${expectedStatus}, Got: ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 100)}...`);
        }
        resolve(success);
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${path} - Error: ${e.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log(`❌ ${path} - Timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

async function runTests() {
  console.log('Testing basic endpoints...');
  
  const results = await Promise.all([
    testEndpoint('/health'),
    testEndpoint('/api/ping'),
    testEndpoint('/api/demo'),
    testEndpoint('/api/health'),
    testEndpoint('/'),
  ]);

  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Server is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the server logs for details.');
  }
}

runTests().catch(console.error);
