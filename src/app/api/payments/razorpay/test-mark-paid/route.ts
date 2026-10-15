import { NextRequest, NextResponse } from 'next/server';
import { Db, ObjectId } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

type Item = { productId: string; color: string; quantity: number };

interface ColorVariant {
  colorName?: string;
  stock?: number;
}

interface Product {
  name?: string;
  colors?: ColorVariant[];
  stock?: number;
}

interface Order {
  _id: ObjectId;
  userId: string;
  orderNumber: string;
  items?: Item[];
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

async function validateAndUpdateInventory(
  db: Db,
  items: Array<Item>,
): Promise<{ success: boolean; error?: string }> {
  const products = db.collection('products');

  for (const item of items) {
    const product = await products.findOne({ _id: new ObjectId(item.productId) });
    if (!product) return { success: false, error: `Product not found: ${item.productId}` };

    let availableStock = 0;
    if (product.colors && Array.isArray(product.colors)) {
      const colorVariant = product.colors.find(
        (c: ColorVariant) => c && String(c.colorName || '').trim().toLowerCase() === item.color.trim().toLowerCase(),
      );
      if (!colorVariant) return { success: false, error: `Color variant not found: ${item.color} for product ${product.name}` };
      availableStock = Number(colorVariant.stock) || 0;
    } else {
      availableStock = Number(product.stock) || 0;
    }

    if (availableStock < item.quantity) {
      return { success: false, error: `Insufficient stock for ${item.color} (${item.productId}). Available: ${availableStock}, Requested: ${item.quantity}` };
    }
  }

  for (const item of items) {
    const product = await products.findOne({ _id: new ObjectId(item.productId) });
    if (!product) return { success: false, error: `Product not found during update: ${item.productId}` };

    if (product.colors && Array.isArray(product.colors)) {
      const colorIndex = product.colors.findIndex(
        (c: ColorVariant) => c && String(c.colorName || '').trim().toLowerCase() === item.color.trim().toLowerCase(),
      );
      if (colorIndex === -1) return { success: false, error: `Color variant not found during update: ${item.color} for product ${item.productId}` };
      const currentStock = Number(product.colors[colorIndex].stock) || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      await products.updateOne({ _id: new ObjectId(item.productId) }, { $set: { [`colors.${colorIndex}.stock`]: newStock, updatedAt: new Date() } });
    } else {
      const currentStock = Number(product.stock) || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      await products.updateOne({ _id: new ObjectId(item.productId) }, { $set: { stock: newStock, updatedAt: new Date() } });
    }
  }

  return { success: true };
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Not allowed in production' }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as { orderNumber?: unknown; razorpayOrderId?: unknown };
    const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim() : '';
    const razorpayOrderId = typeof body.razorpayOrderId === 'string' ? body.razorpayOrderId.trim() : '';

    if (!orderNumber && !razorpayOrderId) {
      return NextResponse.json({ success: false, error: 'Provide orderNumber or razorpayOrderId' }, { status: 400 });
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) return NextResponse.json({ success: false, error: 'MONGODB_URI not configured' }, { status: 500 });

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const orders = db.collection('orders');

    let existingOrder: Order | null = null;
    if (razorpayOrderId) existingOrder = await orders.findOne({ razorpayOrderId }) as Order | null;
    if (!existingOrder && orderNumber) existingOrder = await orders.findOne({ orderNumber }) as Order | null;

    if (!existingOrder) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    if (existingOrder.paymentStatus === 'paid') return NextResponse.json({ success: true, message: 'Already paid' });

    const inventoryResult = await validateAndUpdateInventory(db, existingOrder.items || []);
    if (!inventoryResult.success) return NextResponse.json({ success: false, error: inventoryResult.error }, { status: 400 });

    const updateResult = await orders.updateOne(
      { _id: existingOrder._id },
      { $set: { paymentStatus: 'paid', orderStatus: 'confirmed', razorpayPaymentId: `test_${Date.now()}`, updatedAt: new Date() } }
    );
    if (updateResult.matchedCount === 0) return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });

    // Handle Super Coins redemption for test endpoint
    try {
      const updatedOrder = await orders.findOne({ _id: existingOrder._id }) as Order | null;
      if (updatedOrder && updatedOrder.usedSuperCoins && updatedOrder.coinsRedeemed && !updatedOrder.rewardTransactionId) {
        const coinsToDeduct = Number(updatedOrder.coinsRedeemed) || 0;
        if (coinsToDeduct > 0) {
          const users = db.collection('users');
          let user: User | null = null;
          try {
            user = await users.findOne({ _id: new ObjectId(String(updatedOrder.userId)) }) as User | null;
          } catch (error) {
            // Ignore ObjectId conversion errors, will try with id field next
          }
          if (!user) {
            user = await users.findOne({ id: updatedOrder.userId }) as User | null;
          }

          const currentBalance = user?.superCoinsBalance || 0;
          if (currentBalance >= coinsToDeduct) {
            const newBalance = Math.max(0, currentBalance - coinsToDeduct);
            const transactions = db.collection('rewardTransactions');
            const transaction = {
              userId: updatedOrder.userId,
              orderId: updatedOrder._id?.toString(),
              transactionType: 'Redeem',
              coins: coinsToDeduct,
              balanceBefore: currentBalance,
              balanceAfter: newBalance,
              status: 'Completed',
              description: `Coins redeemed for order ${updatedOrder.orderNumber} (test payment)`,
              createdBy: 'system',
              createdAt: new Date(),
            };

            const txRes = await transactions.insertOne(transaction);
            const updateFilter: Record<string, unknown> = user && user._id ? { _id: user._id } : { id: updatedOrder.userId };
            await users.updateOne(updateFilter, { $set: { superCoinsBalance: newBalance } });
            await orders.updateOne({ _id: updatedOrder._id }, { $set: { rewardTransactionId: txRes.insertedId.toString() } });
            console.log(`✓ Test endpoint: deducted ${coinsToDeduct} coins for user ${updatedOrder.userId} on order ${updatedOrder.orderNumber}`);
          } else {
            console.warn(`⚠️ Test endpoint: insufficient balance for coin deduction on order ${updatedOrder.orderNumber}`);
          }
        }
      }
    } catch (e) {
      console.error('Test endpoint: failed to process coin redemption', e);
    }

    return NextResponse.json({ success: true, message: 'Order finalized (test only)' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
