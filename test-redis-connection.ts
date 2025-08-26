import Redis from 'ioredis';

const urls = [
  'redis://default:22e31c342a464b6ca1f35bdc10bd971d@fly-bun-app-redis.upstash.io:6379',
  'rediss://default:22e31c342a464b6ca1f35bdc10bd971d@fly-bun-app-redis.upstash.io:6379',
];

async function testConnection(url: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`Testing: ${url.replace(/:[^:@]*@/, ':****@')}`);
  console.log('='.repeat(60));
  
  try {
    const redis = new Redis(url, {
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 300);
      },
      tls: url.startsWith('rediss') ? {
        rejectUnauthorized: false
      } : undefined,
    });

    redis.on('error', (err) => {
      console.error('Error event:', err.message);
    });

    redis.on('connect', () => {
      console.log('✅ Connected successfully!');
    });

    redis.on('ready', () => {
      console.log('✅ Redis ready!');
    });

    // Try a simple command
    console.log('Attempting PING...');
    const result = await redis.ping();
    console.log('✅ PING response:', result);
    
    // Try setting and getting a value
    await redis.set('test:key', 'test-value');
    const value = await redis.get('test:key');
    console.log('✅ SET/GET test:', value);
    
    // Clean up
    await redis.del('test:key');
    await redis.quit();
    console.log('✅ Connection test successful!');
    return true;
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    if (error.code) console.error('   Error code:', error.code);
    if (error.hostname) console.error('   Hostname:', error.hostname);
    return false;
  }
}

async function runTests() {
  console.log('Starting Redis connection tests...\n');
  
  for (const url of urls) {
    await testConnection(url);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Tests complete!');
}

runTests().catch(console.error);