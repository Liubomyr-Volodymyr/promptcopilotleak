'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "@/types/users.types";

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, user }) => {
    if (!user) return null;

    const s = user.subscription;

    const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Subscription Stripe Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Subscription ID (db)</p>
                            <p>{s?.id ?? '—'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Stripe subscription id</p>
                            <p>{s?.stripeSubscriptionId ?? '—'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Price ID</p>
                            <p>{s?.priceId ?? '—'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Product ID</p>
                            <p>{s?.productId ?? '—'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Current Period End</p>
                                <p>{fmt(s?.currentPeriodEnd)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Ended At</p>
                                <p>{fmt(s?.endedAt)}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Created At</p>
                            <p>{fmt(s?.createdAt)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p>{s?.subscriptionStatus ?? 'none'}</p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
