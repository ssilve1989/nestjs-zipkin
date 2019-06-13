import { ServerRedis, MessageHandler } from '@nestjs/microservices';
import { Tracer, InetAddress, Annotation } from 'zipkin';
import { RedisOptions } from '@nestjs/common/interfaces/microservices/microservice-configuration.interface';
import { createTracer, getTraceId } from '../common';
import { TraceablePayload } from '../zipkin.interfaces';
import { ZipkinRedisOptions } from './zipkin-redis.interfaces';

export class ZipkinRedisServer extends ServerRedis {
  private tracer: Tracer;
  private serviceName: string;
  private serverAddress: {
    serviceName: string;
    host: InetAddress;
    port: number;
  };

  public constructor(
    { serviceName, host, port }: ZipkinRedisOptions,
    options: RedisOptions['options']
  ) {
    super(options);
    this.tracer = createTracer(serviceName);
    this.serviceName = serviceName;
    this.serverAddress = {
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
        this.tracer.recordAnnotation(new Annotation.ServerRecv());
      });

      return result;
    };
  }

  private recordTrace(pattern: any, data: TraceablePayload) {
    // get the trace from the payload if there is one
    const rootTraceId = getTraceId(this.tracer, data);
    this.tracer.setId(rootTraceId);
    // create a new spanId (childId) for this trace
    const childTraceId = this.tracer.createChildId();

    this.tracer.letId(childTraceId, () => {
      this.tracer.recordRpc(JSON.stringify(pattern));
      this.tracer.recordAnnotation(new Annotation.ServiceName(this.serviceName));
      this.tracer.recordAnnotation(new Annotation.ServerAddr(this.serverAddress));
      this.tracer.recordAnnotation(new Annotation.ServerSend());
      // this.tracer.recordAnnotation(new Annotation.ClientRecv());
      this.tracer.recordAnnotation(
        new Annotation.BinaryAnnotation('payload', JSON.stringify(data))
      );
    });

    return { rootTraceId, childTraceId };
  }
}
