import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import { shouldProcessSuperCoinRedemption } from '@/lib/rewards';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

interface Order {
  _id: ObjectId;
  userId: string;
  orderNumber: string;
  paymentStatus: string;
  usedSuperCoins?: boolean;
  coinsRedeemed?: number;
  rewardTransactionId?: string;
}

interface User {
  _id?: ObjectId;
  id?: string;
  superCoinsBalance?: number;
}

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export async function POST(req: NextRequest) {
  try {
    const secret = getEnv('RAZORPAY_SECRET');

    const body = (await req.json().catch(() => ({}))) as {
      razorpay_order_id?: unknown;
      razorpay_payment_id?: unknown;
      razorpay_signature?: unknown;
    };

    const orderId = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id.trim() : '';
    const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id.trim() : '';
    const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature.trim() : '';

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ success: false, error: 'Missing payment verification fields' }, { status: 400 });
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expected !== signature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return NextResponse.json({ success: false, error: 'MONGODB_URI not configured' }, { status: 500 });
    }

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const orders = db.collection('orders');
    const users = db.collection('users');
    const transactions = db.collection('rewardTransactions');

    const order = await orders.findOne({ razorpayOrderId: orderId });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus !== 'paid') {
      await orders.updateOne(
        { _id: order._id },
        {
          $set: {
            paymentStatus: 'paid',
            orderStatus: 'confirmed',
            razorpayPaymentId: paymentId,
            updatedAt: new Date(),
          },
        }
      );
    }

    const finalizedOrder = await orders.findOne({ _id: order._id }) as Order | null;
    if (finalizedOrder && shouldProcessSuperCoinRedemption(finalizedOrder)) {
      const coinsToDeduct = Number(finalizedOrder.coinsRedeemed || 0);
      let user: User | null = null;
      try {
        user = await users.findOne({ _id: new ObjectId(String(finalizedOrder.userId)) }) as User | null;
      } catch (error) {
        // Ignore ObjectId conversion errors, will try with id field next
      }
      if (!user) {
        user = await users.findOne({ id: finalizedOrder.userId }) as User | null;
      }

      if (user) {
        const currentBalance = Number(user.superCoinsBalance || 0);
        if (currentBalance >= coinsToDeduct) {
          const newBalance = currentBalance - coinsToDeduct;
          const txRes = await transactions.insertOne({
            userId: finalizedOrder.userId,
            orderId: finalizedOrder._id?.toString(),
            transactionType: 'Redeem',
            coins: coinsToDeduct,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            status: 'Completed',
            description: `Coins redeemed for order ${finalizedOrder.orderNumber}`,
            createdBy: 'system',
            createdAt: new Date(),
          });

          const updateFilter: Record<string, unknown> = user._id ? { _id: user._id } : { id: finalizedOrder.userId };
          await users.updateOne(updateFilter, { $set: { superCoinsBalance: newBalance } });
          await orders.updateOne(
            { _id: finalizedOrder._id },
            {
              $set: {
                rewardTransactionId: txRes.insertedId.toString(),
                coinRedeemed: true,
              },
            }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
