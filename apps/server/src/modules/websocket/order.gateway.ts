import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/order',
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients: Map<string, Socket> = new Map();

  handleConnection(client: Socket) {
    console.log(`客户端连接: ${client.id}`);
    this.clients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    console.log(`客户端断开: ${client.id}`);
    this.clients.delete(client.id);
  }

  @SubscribeMessage('join-production')
  handleJoinProduction(client: Socket, data: any) {
    client.join('production-room');
    console.log(`制作端加入: ${client.id}`);
  }

  // 推送新订单到制作端
  notifyNewOrder(order: any) {
    this.server.to('production-room').emit('new-order', {
      type: 'NEW_ORDER',
      data: order,
      timestamp: new Date(),
    });
    console.log(`新订单推送: ${order.order_no}`);
  }

  // 推送订单状态变更
  notifyOrderStatusChange(order: any) {
    this.server.emit('order-status-change', {
      type: 'STATUS_CHANGE',
      data: order,
      timestamp: new Date(),
    });
    console.log(`订单状态变更: ${order.order_no} -> ${order.status}`);
  }

  // 推送给特定用户
  notifyUser(userId: string, event: string, data: any) {
    this.server.emit(`user-${userId}`, {
      event,
      data,
      timestamp: new Date(),
    });
  }
}
