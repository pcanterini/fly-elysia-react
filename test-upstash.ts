// Test 1: Using ioredis with Redis protocol
import Redis from 'ioredis';

async function testIoredis() {
  console.log('\n=== Testing with ioredis (Redis protocol) ===');
  try {
    const client = new Redis("redis://default:22e31c342a464b6ca1f35bdc10bd971d@fly-bun-app-redis.upstash.io:6379");
    
    console.log('Setting foo=bar...');
    await client.set('foo', 'bar');
    
    console.log('Getting foo...');
    const value = await client.get('foo');
    console.log('Value:', value);
    
    await client.quit();
    console.log('✅ ioredis test successful!');
  } catch (error: any) {
    console.error('❌ ioredis failed:', error.message);
  }
}

// Test 2: Using @upstash/redis with HTTP
async function testUpstashHttp() {
  console.log('\n=== Testing with @upstash/redis (HTTP) ===');
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: 'http://fly-bun-app-redis.upstash.io:6379',
      token: 'AZjPACQgOWNiMGE0ZGQtMzljOC00OWRiLWE5MzctNWUzZjczNGViNWRhMjJlMzFjMzQyYTQ2NGI2Y2ExZjM1YmRjMTBiZDk3MWQ=',
    });

    console.log('Setting test=value...');
    await redis.set("test", "value");
    
    console.log('Getting test...');
    const result = await redis.get("test");
    console.log('Value:', result);
    
    console.log('✅ @upstash/redis test successful!');
  } catch (error: any) {
    console.error('❌ @upstash/redis failed:', error.message);
  }
}

// Run both tests
async function main() {
  await testIoredis();
  await testUpstashHttp();
}

main().catch(console.error);