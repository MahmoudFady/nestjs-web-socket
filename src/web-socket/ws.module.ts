import { Global, Module } from '@nestjs/common';
import { SocketGateway } from './ws.gateway';
@Global()
@Module({
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class WebSocketModule {}
