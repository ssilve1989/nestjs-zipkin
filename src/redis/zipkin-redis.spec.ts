import { ZipkinRedisServer } from './zipkin-redis-server';

describe('ZipkinServer', () => {
  describe('Redis Server', () => {
    let server: ZipkinRedisServer;

    beforeEach(() => {
      server = new ZipkinRedisServer(
        { host: 'localhost', port: 6379, serviceName: 'jest' },
        {
          url: 'redis://localhost:6379',
        }
      );
    });

    it('should be defined', () => {
      expect(server).toBeDefined();
      expect(server.getHandlerByPattern).toBeDefined();
    });
  });
});
