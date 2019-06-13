import { ServerRedis, MessageHandler } from '@nestjs/microservices';
import os from 'os';
import { Tracer, InetAddress, Annotation } from 'zipkin';
import { RedisOptions } from '@nestjs/common/interfaces/microservices/microservice-configuration.interface';
import { createTracer, getTraceId, recordObjectAsBinary } from '../common';
import { TraceablePayload } from '../zipkin.interfaces';
import { ZipkinRedisOptions, ServiceAddress } from './zipkin-redis.interfaces';

export class ZipkinRedisServer extends ServerRedis {
  private tracer: Tracer;
  private serviceAddress: ServiceAddress;
  private redisAddress: ServiceAddress;

  public constructor(
    { serviceName, host, port }: ZipkinRedisOptions,
    options: RedisOptions['options']
  ) {
    super(options);
    this.tracer = createTracer(serviceName);
    this.serviceAddress = {
      serviceName,
      host: new InetAddress(os.hostname()),
      port,
    };

    this.redisAddress = {
      serviceName: 'redis',
      host: new InetAddress(host),
      port,
    };
  }

  public getHandlerByPattern(pattern: any): MessageHandler | null {
    const handler = super.getHandlerByPattern(pattern);
    return handler ? this.withTrace(pattern, handler) : handler;
  }

  private withTrace(pattern: any, handler: MessageHandler) {
    return async (data: TraceablePayload) => {
      const { childTraceId } = this.recordTrace(pattern, data);

      const result = await handler(data);

      this.tracer.letId(childTraceId, () => {
        this.tracer.recordAnnotation(new Annotation.ClientRecv());
      });

      return result;
    };
  }

  private recordTrace(pattern: any, data: TraceablePayload) {
    // get the trace from the payload if there is one
    const rootTraceId = getTraceId(this.tracer, data);
    this.tracer.setId(rootTraceId);

    this.tracer.letId(rootTraceId, () => {
      this.tracer.recordAnnotation(new Annotation.ServerRecv());
    });

    // create a new spanId (childId) for this trace
    const childTraceId = this.tracer.createChildId();

    this.tracer.letId(childTraceId, () => {
      this.tracer.recordRpc(JSON.stringify(pattern));
      this.tracer.recordAnnotation(new Annotation.ServiceName(this.serviceAddress.serviceName));
      this.tracer.recordAnnotation(new Annotation.ClientAddr(this.serviceAddress));
      this.tracer.recordAnnotation(new Annotation.ClientSend());
      recordObjectAsBinary(this.tracer, data);
    });

    return { rootTraceId, childTraceId };
  }
}
