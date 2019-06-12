import { ClientRedis } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { Tracer, InetAddress, TraceId, Annotation } from 'zipkin';
import { tap } from 'rxjs/operators';
import { ZipkinRedisOptions } from './zipkin-redis.interfaces';
import { createTracer, getTraceId } from '../common';
import { TraceablePayload } from '../zipkin.interfaces';

export type TracerMetaFn = (tracer: Tracer) => void;
const noop = () => {};

export class ZipkinRedisClient extends ClientRedis {
  private readonly tracer: Tracer;
  private readonly serviceName: string;
  private readonly serverAddress: {
    serviceName: string;
    host: InetAddress;
    port: number;
  };

  public constructor(
    { serviceName, host, port }: ZipkinRedisOptions,
    options: ClientRedis['options']
  ) {
    super(options);
    this.serviceName = serviceName;
    this.tracer = createTracer(serviceName);

    this.serverAddress = {
      serviceName: 'redis',
      host: new InetAddress(host),
      port,
    };
  }

  public send(pattern: string, data: any) {
    const traceId = this.recordTrace(
      pattern,
      typeof data === 'object' ? data : { payload: data, traceId: undefined }
    );

    this.tracer.setId(traceId);

    return super
      .send(pattern, { ...data, traceId: traceId.traceId })
      .pipe(tap(this.recordAckTrace(traceId)));
  }

  public emit(pattern: any, data: any, tracerCb: TracerMetaFn = noop) {
    const trace = this.recordSendTrace(pattern, data);

    try {
      tracerCb(this.tracer);
    } catch (e) {
      this.logger.warn(e.stack);
    }

    return super
      .emit(pattern, { ...data, traceId: trace.traceId })
      .pipe(tap(this.recordAckTrace(trace)));
  }

  private recordSendTrace(pattern: any, data: any) {
    const traceId = this.recordTrace(
      pattern,
      typeof data === 'object' ? data : { payload: data, traceId: undefined }
    );

    this.tracer.setId(traceId);
    return traceId;
  }

  private recordAckTrace(trace: TraceId) {
    return () => {
      this.tracer.letId(trace, () => {
        this.tracer.recordAnnotation(new Annotation.ClientRecv());
      });
    };
  }

  private recordTrace(pattern: any, data: TraceablePayload) {
    const traceId = getTraceId(this.tracer, data);

    this.logger.debug(`Recording trace with: ${traceId}`);

    this.tracer.letId(traceId, () => {
      this.tracer.recordRpc(JSON.stringify(pattern));
      this.tracer.recordAnnotation(new Annotation.ServiceName(this.serviceName));
      this.tracer.recordAnnotation(new Annotation.ServerAddr(this.serverAddress));
      this.tracer.recordAnnotation(new Annotation.ClientSend());
    });

    return traceId;
  }
}
