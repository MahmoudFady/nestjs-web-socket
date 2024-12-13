import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocketEvents } from './types/ws-events.enum';
import { Injectable } from '@nestjs/common';

@WebSocketGateway()
@Injectable()
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly connectionMapper: Record<string, string[]> = {};
  @WebSocketServer() server: Server;

  afterInit() {
    console.log('websocket gateway initialized');
  }
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      client.emit(WebSocketEvents.ERROR, { message: 'auth faild' });
      client.disconnect();
      return;
    }
    const userConnections = this.connectionMapper[userId] || [];
    userConnections.push(client.id);
    this.connectionMapper[userId] = userConnections;
    console.log(
      'connection established',
      'userId = ',
      userId,
      this.connectionMapper[userId],
    );
  }
  handleDisconnect(client: Socket) {
    let userId = null;
    for (let k in this.connectionMapper) {
      if (this.connectionMapper[k].includes(client.id)) {
        userId = k;
      }
    }
    const userConnections = this.connectionMapper[userId].filter(
      (c) => c !== client.id,
    );
    if (!userId) {
      return;
    }
    if (userConnections.length == 0) {
      delete this.connectionMapper[userId];
      return;
    }
    this.connectionMapper[userId] = userConnections;
  }

  notifyUser(
    userId: string,
    payload: any,
    event = WebSocketEvents.NOTIFICATION,
  ) {
    const userConnections = this.connectionMapper[userId];
    if (!userConnections) {
      return;
    }
    userConnections.forEach((connection) => {
      const userSocket = this.server.sockets.sockets.get(connection);
      userSocket.emit(event, payload);
    });
  }

  broadcast(payload: any, event = WebSocketEvents.NOTIFICATION) {
    this.server.emit(event, payload);
  }

  @SubscribeMessage(WebSocketEvents.JOIN_ROOM)
  handleJoinRoom(socket: Socket, payload: { username: string; room: string }) {
    const { username, room } = payload;
    socket.to(room).emit(WebSocketEvents.JOIN_ROOM, `${username} joined`);
  }

  @SubscribeMessage(WebSocketEvents.LEAVE_ROOM)
  handleLeaveRoom(socket: Socket, payload: { username: string; room: string }) {
    const { username, room } = payload;
    socket.to(room).emit(WebSocketEvents.LEAVE_ROOM, `${username} left`);
  }

  sendToRoom(room: string, payload: any) {
    this.server.to(room).emit(WebSocketEvents.ROOM_MESSAGE, payload);
  }
}
