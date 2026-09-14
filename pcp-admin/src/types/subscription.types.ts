export type Subscription = {
    id: number;
    priceId?: string | null;
    productId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: string | null;
    canceledAt?: string | null;
    endedAt?: string | null;
    createdAt: string;
    hasSubscription: boolean;
    subscriptionStatus: 'none' | 'active' | 'canceled' | 'ended' | 'cancel_at_period_end';
};
