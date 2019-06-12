import { Tracer, InetAddress } from 'zipkin';

export interface NestZipkinTracer {
  tracer: Tracer;
  serverAddress: {
    serviceName: string;
    host: InetAddress;
    port: number;
  };
}

export type TraceablePayload = {
  payload: any;
  traceId?: string;
};
