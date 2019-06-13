import { Tracer, BatchRecorder, jsonEncoder, TraceId, randomTraceId, option } from 'zipkin';
import CLSContext from 'zipkin-context-cls';
import { HttpLogger } from 'zipkin-transport-http';
import { TraceablePayload } from './zipkin.interfaces';

export function createTracer(serviceName: string) {
  const ctxImpl = new CLSContext('zipkin');
  const recorder = new BatchRecorder({
    logger: new HttpLogger({
      jsonEncoder: jsonEncoder.JSON_V2,
      endpoint: 'http://localhost:9411/api/v2/spans',
    }),
  });

  return new Tracer({ ctxImpl, recorder, localServiceName: serviceName });
}

export function getTraceId(tracer: Tracer, data: TraceablePayload) {
  if (typeof data === 'object' && data.traceId) {
    const traceId = new TraceId({
      spanId: randomTraceId(),
      traceId: new option.Some(data.traceId),
    });

    return traceId;
  }
  return tracer.createRootId(); // might need to be child?
}

export function recordObjectAsBinary(tracer: Tracer, object: { [key: string]: any }) {
  Object.entries(object).forEach(([key, value]) => tracer.recordBinary(key, JSON.stringify(value)));
}
