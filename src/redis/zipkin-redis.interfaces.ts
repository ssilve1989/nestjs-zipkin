import { InetAddress } from 'zipkin';

export type ZipkinRedisOptions = {
  host: string;
  port: number;
  serviceName: string;
};

export type ServiceAddress = {
  serviceName: string;
  host: InetAddress;
  port: number;
};
