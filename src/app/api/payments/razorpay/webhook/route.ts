import { NextRequest, NextResponse } from 'next/server';
import { Db, ObjectId } from 'mongodb';
import crypto from 'crypto';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

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
  razorpayOrderId?: string;
  paymentStatus: string;
  items?: Array<{ productId: string; color: string; quantity: number }>;
  usedSuperCoins?: boolean;
  coinsRedeemed?: number;
  coinDiscount?: number;
  rewardTransactionId?: string;
}

interface User {
  _id?: ObjectId;
  id?: string;
  superCoinsBalance?: number;
}

interface Transaction {
  status?: string;
  coins?: number;
  description?: string;
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function verifyRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}



type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        [key: string]: unknown;
      };
    };
  };
};

async function validateAndUpdateInventory(
  db: Db,
  items: Array<{ productId: string; color: string; quantity: number }>,
  updateStock = true,
): Promise<{ success: boolean; error?: string }> {
  const products = db.collection('products');

  for (const item of items) {
    const product = await products.findOne({ _id: new ObjectId(item.productId) });
    if (!product) {
      return { success: false, error: `Product not found: ${item.productId}` };
    }

    let availableStock = 0;
    if (product.colors && Array.isArray(product.colors)) {
      const colorVariant = product.colors.find(
        (c: ColorVariant) =>
          c && typeof c.colorName === 'string' &&
          String(c.colorName).trim().toLowerCase() === item.color.trim().toLowerCase()
      );
      if (!colorVariant) {
        return { success: false, error: `Color variant not found: ${item.color} for product ${product.name}` };
      }
      availableStock = Number(colorVariant.stock) || 0;
    } else {
      availableStock = Number(product.stock) || 0;
    }

    if (availableStock < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for ${item.color} (${item.productId}). Available: ${availableStock}, Requested: ${item.quantity}`,
      };
    }
  }

  if (!updateStock) {
    return { success: true };
  }

  for (const item of items) {
    const product = await products.findOne({ _id: new ObjectId(item.productId) });
    if (!product) {
      return { success: false, error: `Product not found during update: ${item.productId}` };
    }

    if (product.colors && Array.isArray(product.colors)) {
      const colorIndex = product.colors.findIndex(
        (c: ColorVariant) =>
          c && typeof c.colorName === 'string' &&
          String(c.colorName).trim().toLowerCase() === item.color.trim().toLowerCase()
      );

      if (colorIndex === -1) {
        return { success: false, error: `Color variant not found during update: ${item.color} for product ${item.productId}` };
      }

      const currentStock = Number(product.colors[colorIndex].stock) || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      await products.updateOne(
        { _id: new ObjectId(item.productId) },
        { $set: { [`colors.${colorIndex}.stock`]: newStock, updatedAt: new Date() } }
      );
    } else {
      const currentStock = Number(product.stock) || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      await products.updateOne(
        { _id: new ObjectId(item.productId) },
        { $set: { stock: newStock, updatedAt: new Date() } }
      );
    }
  }

  return { success: true };
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || getEnv('RAZORPAY_SECRET');
    const signature = request.headers.get('x-razorpay-signature') || '';
    const rawBody = await request.text();

    if (!signature) {
      console.error('Razorpay webhook: missing signature header');
      return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 400 });
    }

    if (!verifyRazorpaySignature(rawBody, signature, secret)) {
      console.error('Razorpay webhook: invalid signature');
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    let webhookData: RazorpayWebhookPayload;
    try {
      webhookData = JSON.parse(rawBody) as RazorpayWebhookPayload;
    } catch (error) {
      console.error('Razorpay webhook: invalid JSON body', error);
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    if (webhookData.event !== 'payment.captured') {
      console.log('Razorpay webhook: ignored event', webhookData.event);

      // Handle payment failure - restore coins if they were deducted
      if (webhookData.event === 'payment.failed') {
        const paymentEntity = webhookData.payload?.payment?.entity;
        const orderId = String(paymentEntity?.order_id || '').trim();

        if (orderId) {
          try {
            const uri = process.env.MONGODB_URI;
            if (uri) {
              const client = await getMongoClient(uri);
              const db = client.db(getDatabaseName());
              const orders = db.collection('orders');

              const failedOrder = await orders.findOne({ razorpayOrderId: orderId }) as Order | null;
              if (failedOrder && failedOrder.rewardTransactionId) {
                console.log(`🔄 Razorpay webhook: payment failed for order ${failedOrder.orderNumber}, processing coin reversal`);

                const transactions = db.collection('rewardTransactions');
                const txId = failedOrder.rewardTransactionId;

                try {
                  const tx = await transactions.findOne({ _id: new ObjectId(txId) }) as Transaction | null;
                  if (tx && tx.status === 'Pending' && tx.coins && tx.coins > 0) {
                    const users = db.collection('users');
                    let user: User | null = null;
                    try {
                      user = await users.findOne({ _id: new ObjectId(String(failedOrder.userId)) }) as User | null;
                    } catch (error) {
                      // Ignore ObjectId conversion errors, will try with id field next
                    }
                    if (!user) {
                      user = await users.findOne({ id: failedOrder.userId }) as User | null;
                    }

                    const currentBalance = user?.superCoinsBalance || 0;
                    const restoredBalance = currentBalance + tx.coins;

                    // Restore coins
                    const updateFilter: Record<string, unknown> = user && user._id ? { _id: user._id } : { id: failedOrder.userId };
                    await users.updateOne(updateFilter, { $set: { superCoinsBalance: restoredBalance } });

                    // Mark transaction as Cancelled
                    await transactions.updateOne(
                      { _id: new ObjectId(txId) },
                      { $set: { status: 'Cancelled', description: `${tx.description} - Payment failed, coins restored` } }
                    );

                    console.log(`✓ Razorpay webhook: restored ${tx.coins} coins for order ${failedOrder.orderNumber}`);
                  }
                } catch (e) {
                  console.error('Error restoring coins for failed payment:', e);
                }
              }
            }
          } catch (e) {
            console.error('Error handling payment.failed webhook:', e);
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Event processed' });
    }

    const paymentEntity = webhookData.payload?.payment?.entity;
    const orderId = String(paymentEntity?.order_id || '').trim();
    const paymentId = String(paymentEntity?.id || '').trim();
    const status = String(paymentEntity?.status || '').trim().toLowerCase();

    if (!orderId || !paymentId || status !== 'captured') {
      console.error('Razorpay webhook: invalid payment capture payload', { orderId, paymentId, status });
      return NextResponse.json({ success: false, error: 'Invalid payment capture payload' }, { status: 400 });
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('Razorpay webhook: MONGODB_URI is not configured');
      return NextResponse.json({ success: false, error: 'MONGODB_URI is not configured' }, { status: 500 });
    }

    try {
      const client = await getMongoClient(uri);
      const db = client.db(getDatabaseName());
      const orders = db.collection('orders');

      let existingOrder = await orders.findOne({ razorpayOrderId: orderId }) as Order | null;
      if (!existingOrder) {
        const notes = paymentEntity?.notes as Record<string, unknown> | undefined;
        const fallbackOrderNumber = typeof notes?.orderNumber === 'string' ? notes.orderNumber.trim() : undefined;

        if (fallbackOrderNumber) {
          existingOrder = await orders.findOne({ orderNumber: fallbackOrderNumber }) as Order | null;
          if (existingOrder) {
            console.log('Razorpay webhook: found order by fallback orderNumber', fallbackOrderNumber);
          }
        }
      }

      if (!existingOrder) {
        console.error('Razorpay webhook: order not found for razorpayOrderId', orderId);
        return NextResponse.json({ success: true, message: 'Order not found, ignoring' });
      }

      if (existingOrder.paymentStatus === 'paid') {
        console.log('Razorpay webhook: order already finalized', existingOrder.orderNumber);
        return NextResponse.json({ success: true, message: 'Already finalized' });
      }

      const inventoryResult = await validateAndUpdateInventory(db, existingOrder.items || [], true);
      if (!inventoryResult.success) {
        console.error('Razorpay webhook: inventory update failed', inventoryResult.error);
        return NextResponse.json({ success: false, error: inventoryResult.error }, { status: 400 });
      }

      const updateResult = await orders.updateOne(
        { _id: existingOrder._id },
        {
          $set: {
            paymentStatus: 'paid',
            orderStatus: 'confirmed',
            razorpayPaymentId: paymentId,
            updatedAt: new Date(),
          },
        }
      );

      if (updateResult.matchedCount === 0) {
        console.error('Razorpay webhook: failed to update order status', existingOrder._id);
        return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
      }

      console.log('🎉 Razorpay webhook: PAYMENT.CAPTURED finalized order', existingOrder.orderNumber, 'paymentId', paymentId);

      // Handle Super Coins deduction when payment is captured
      console.log(`\n💰 [COIN-DEDUCTION] Payment confirmed for order: ${existingOrder.orderNumber}`);
      try {
        const updatedOrder = await orders.findOne({ _id: existingOrder._id }) as Order | null;
        console.log(`💰 [COIN-DEDUCTION] Order fields:`, {
          usedSuperCoins: updatedOrder?.usedSuperCoins,
          coinsRedeemed: updatedOrder?.coinsRedeemed,
          coinDiscount: updatedOrder?.coinDiscount,
          rewardTransactionId: updatedOrder?.rewardTransactionId,
        });

        if (!updatedOrder) {
          console.error(`💰 [COIN-DEDUCTION] ✗ Order not found after payment!`);
        } else if (!updatedOrder.usedSuperCoins) {
          console.log(`💰 [COIN-DEDUCTION] ℹ️ This order doesn't use Super Coins`);
        } else if (updatedOrder.rewardTransactionId) {
          console.log(`💰 [COIN-DEDUCTION] ✓ Coins already deducted for this order`);
        } else {
          // Get coins to deduct
          const coinsToDeduct = Number(updatedOrder.coinsRedeemed) || 0;

          if (coinsToDeduct <= 0) {
            console.error(`💰 [COIN-DEDUCTION] ✗ Invalid coinsRedeemed: ${coinsToDeduct}`);
          } else {
            console.log(`💰 [COIN-DEDUCTION] Processing coin deduction: ${coinsToDeduct} coins for userId: ${updatedOrder.userId}`);

            const users = db.collection('users');

            // Try to find user by ObjectId first, then by id field
            let user: User | null = null;
            try {
              console.log(`💰 [COIN-DEDUCTION] Looking up user by ObjectId: ${String(updatedOrder.userId)}`);
              user = await users.findOne({ _id: new ObjectId(String(updatedOrder.userId)) }) as User | null;
              if (user) {
                console.log(`💰 [COIN-DEDUCTION] ✓ Found user by ObjectId`);
              }
            } catch (e) {
              console.log(`💰 [COIN-DEDUCTION] ⚠️ ObjectId lookup failed`);
            }

            if (!user) {
              console.log(`💰 [COIN-DEDUCTION] Looking up user by id field: ${updatedOrder.userId}`);
              user = await users.findOne({ id: updatedOrder.userId }) as User | null;
              if (user) {
                console.log(`💰 [COIN-DEDUCTION] ✓ Found user by id field`);
              }
            }

            if (!user) {
              console.error(`💰 [COIN-DEDUCTION] ✗ USER NOT FOUND! userId=${updatedOrder.userId}`);
            } else {
              const currentBalance = user.superCoinsBalance || 0;
              console.log(`💰 [COIN-DEDUCTION] User current balance: ${currentBalance}`);

              if (currentBalance < coinsToDeduct) {
                console.warn(`💰 [COIN-DEDUCTION] ✗ Insufficient balance! Have ${currentBalance}, need ${coinsToDeduct}`);
              } else {
                const newBalance = currentBalance - coinsToDeduct;
                console.log(`💰 [COIN-DEDUCTION] New balance will be: ${newBalance}`);

                // Create transaction record
                const transactions = db.collection('rewardTransactions');
                const transaction = {
                  userId: updatedOrder.userId,
                  orderId: updatedOrder._id?.toString(),
                  transactionType: 'Redeem',
                  coins: coinsToDeduct,
                  balanceBefore: currentBalance,
                  balanceAfter: newBalance,
                  status: 'Completed',
                  description: `Coins redeemed for order ${updatedOrder.orderNumber}`,
                  createdBy: 'system',
                  createdAt: new Date(),
                };

                console.log(`💰 [COIN-DEDUCTION] Creating transaction...`);
                const txRes = await transactions.insertOne(transaction);
                console.log(`💰 [COIN-DEDUCTION] ✓ Transaction created: ${txRes.insertedId}`);

                // Update user balance
                const updateFilter: Record<string, unknown> = user._id ? { _id: user._id } : { id: updatedOrder.userId };
                console.log(`💰 [COIN-DEDUCTION] Updating user with filter:`, updateFilter);
                const userUpdateRes = await users.updateOne(updateFilter, { $set: { superCoinsBalance: newBalance } });
                console.log(`💰 [COIN-DEDUCTION] User update result: matched=${userUpdateRes.matchedCount}, modified=${userUpdateRes.modifiedCount}`);

                if (userUpdateRes.modifiedCount === 0) {
                  console.error(`💰 [COIN-DEDUCTION] ✗ Failed to update user balance!`);
                } else {
                  // Link transaction to order
                  console.log(`💰 [COIN-DEDUCTION] Linking transaction to order...`);
                  await orders.updateOne({ _id: updatedOrder._id }, { $set: { rewardTransactionId: txRes.insertedId.toString() } });
                  console.log(`💰 [COIN-DEDUCTION] ✅ DONE! Deducted ${coinsToDeduct} coins. New balance: ${newBalance}`);
                }
              }
            }
          }
        }
      } catch (e) {
        console.error(`💰 [COIN-DEDUCTION] ✗ ERROR:`, e);
      }
      return NextResponse.json({ success: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Razorpay webhook processing failed', msg);
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Razorpay webhook fatal error', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
