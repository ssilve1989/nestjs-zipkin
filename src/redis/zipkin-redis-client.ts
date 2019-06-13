import { ClientRedis } from '@nestjs/microservices';
import os from 'os';
import { Tracer, InetAddress, TraceId, Annotation } from 'zipkin';
import { tap } from 'rxjs/operators';
import { ZipkinRedisOptions, ServiceAddress } from './zipkin-redis.interfaces';
import { createTracer, getTraceId, recordObjectAsBinary } from '../common';
import { TraceablePayload } from '../zipkin.interfaces';

export type TracerMetaFn = (tracer: Tracer) => void;
export type AdditionalAnnotations = {
  [key: string]: string | boolean | number;
};

export class ZipkinRedisClient extends ClientRedis {
  private readonly tracer: Tracer;
  private readonly serviceName: string;
  private readonly serverAddress: ServiceAddress;
  private readonly clientAddress: ServiceAddress;

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

    this.clientAddress = {
      serviceName,
      host: new InetAddress(os.hostname()),
      port,
    };
  }

  public send(pattern: string, data: any, annotations: AdditionalAnnotations = {}) {
    const traceId = this.recordSendTrace(pattern, data, annotations);

    return super
      .send(pattern, { ...data, traceId: traceId.traceId })
      .pipe(tap(this.recordAckTrace(traceId)));
  }

  public emit(pattern: any, data: any, annotations: AdditionalAnnotations = {}) {
    const trace = this.recordSendTrace(pattern, data, annotations);

    return super
      .emit(pattern, { ...data, traceId: trace.traceId })
      .pipe(tap(this.recordAckTrace(trace)));
  }

  private recordSendTrace(pattern: any, data: any, annotations: AdditionalAnnotations) {
    const traceId = this.recordTrace(
      pattern,
      typeof data === 'object' ? data : { payload: data, traceId: undefined },
      annotations
    );

    this.tracer.setId(traceId);
    return traceId;
  }

  private recordAckTrace(trace: TraceId) {
    return () => {
      this.tracer.letId(trace, () => {
        this.tracer.recordAnnotation(new Annotation.ClientRecv());
        this.tracer.recordAnnotation(new Annotation.ServerSend());
      });
    };
  }

  private recordTrace(pattern: any, data: TraceablePayload, annotations: AdditionalAnnotations) {
    const traceId = getTraceId(this.tracer, data);

    this.logger.debug(
      `Recording trace with: ${traceId} and annotations: ${JSON.stringify(annotations)}`
    );

    this.tracer.letId(traceId, () => {
      this.tracer.recordAnnotation(new Annotation.ClientSend());
      this.tracer.recordAnnotation(new Annotation.ServerAddr(this.serverAddress));
      this.tracer.recordAnnotation(new Annotation.ServiceName(this.serviceName));
      this.tracer.recordClientAddr(new InetAddress(os.hostname()));
      this.tracer.recordRpc(JSON.stringify(pattern));
      recordObjectAsBinary(this.tracer, annotations);

      this.tracer.recordAnnotation(new Annotation.ClientAddr(this.clientAddress));
    });

    return traceId;
  }
}
