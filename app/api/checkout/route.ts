import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use the API version you're working with
});

export async function POST(request: Request) {
  try {
    const { planType } = await request.json();

    console.info(`Creating payment for plan: ${planType},`);

    const planMapping = {
      free: {
        product_id: 'prod_QpVanITngpLECk',
        price_id: 'price_1PxqZ9HKrMJi6qxuIoBYT92l',
        amount: 0,
      },
      pro: {
        product_id: 'prod_QpVbKBbB8lDz1j',
        price_id: 'price_1PxqZxHKrMJi6qxuM0gNM697',
        amount: 10000,
      },
      
      
    };

    if (!(planType in planMapping)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const { price_id } = planMapping[planType];

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'http://localhost:3000',
      cancel_url: 'http://localhost:3000',
      // customer_email: email,
    });

    console.info(`Payment session created: ${session.id}`);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(`Error creating payment session: ${error.message}`);
    //@ts-ignore
    if (error instanceof Stripe.StripeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
