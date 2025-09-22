import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }      socket.userId = user._id?.toString();
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`User ${authSocket.userId} connected to socket`);

    // Join user to their personal room for order updates
    if (authSocket.userId) {
      socket.join(`user_${authSocket.userId}`);
    }

    // Join admin users to admin room
    if (authSocket.userRole === 'admin') {
      socket.join('admin');
    }

    // Handle order tracking
    socket.on('track_order', (orderNumber: string) => {
      socket.join(`order_${orderNumber}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${authSocket.userId} disconnected`);
    });
  });

  return io;
};

// Utility functions for emitting events
export class SocketService {
  private static io: Server;

  static initialize(server: HttpServer) {
    this.io = initializeSocket(server);
    return this.io;
  }

  static getIO() {
    if (!this.io) {
      throw new Error('Socket.IO not initialized');
    }
    return this.io;
  }

  // Notify user about order updates
  static notifyOrderUpdate(userId: string, orderData: any) {
    this.io.to(`user_${userId}`).emit('order_updated', orderData);
  }

  // Notify admin about new orders
  static notifyAdminNewOrder(orderData: any) {
    this.io.to('admin').emit('new_order', orderData);
  }

  // Notify order status change to tracking users
  static notifyOrderStatusChange(orderNumber: string, statusData: any) {
    this.io.to(`order_${orderNumber}`).emit('order_status_changed', statusData);
  }

  // Notify about payment updates
  static notifyPaymentUpdate(userId: string, paymentData: any) {
    this.io.to(`user_${userId}`).emit('payment_updated', paymentData);
  }

  // Notify about stock updates (for real-time inventory)
  static notifyStockUpdate(productId: string, stockData: any) {
    this.io.emit('stock_updated', { productId, ...stockData });
  }

  // Send notification to specific user
  static sendNotification(userId: string, notification: any) {
    this.io.to(`user_${userId}`).emit('notification', notification);
  }

  // Broadcast to all connected users
  static broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }
}
