import { Controller, Get, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { SocketGateway } from './web-socket/ws.gateway';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly socketGateway: SocketGateway,
  ) {}

  @Get('')
  getHello(@Query('uid') uid: string): string {
    if (uid) this.socketGateway.notifyUser(uid, 'welcome uid ' + uid);
    else this.socketGateway.broadcast('to all users');
    return this.appService.getHello();
  }
}
