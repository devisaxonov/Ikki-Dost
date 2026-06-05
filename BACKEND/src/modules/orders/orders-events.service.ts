import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, concat, filter, interval, map, merge, of } from 'rxjs';

type OrderStreamEvent = {
  event: 'created' | 'updated';
  orderId: string;
  userId: number | null;
  status: string;
  createdAt: string;
};

@Injectable()
export class OrdersEventsService {
  private readonly orderEvents$ = new Subject<OrderStreamEvent>();

  createAdminStream(): Observable<MessageEvent> {
    return this.createStream(() => true);
  }

  createUserStream(userId: number): Observable<MessageEvent> {
    return this.createStream((event) => event.userId === userId);
  }

  emitOrderChange(event: OrderStreamEvent) {
    this.orderEvents$.next(event);
  }

  private createStream(
    matcher: (event: OrderStreamEvent) => boolean,
  ): Observable<MessageEvent> {
    const initialEvent$ = of<MessageEvent>({
      type: 'ready',
      data: {
        ok: true,
        at: new Date().toISOString(),
      },
    });

    const updates$ = this.orderEvents$.pipe(
      filter(matcher),
      map(
        (event): MessageEvent => ({
          type: 'orders-updated',
          data: event,
        }),
      ),
    );

    const keepAlive$ = interval(25000).pipe(
      map(
        (): MessageEvent => ({
          type: 'keepalive',
          data: {
            at: new Date().toISOString(),
          },
        }),
      ),
    );

    return concat(initialEvent$, merge(updates$, keepAlive$));
  }
}
