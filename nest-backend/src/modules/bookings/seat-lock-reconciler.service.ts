import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { RedisService } from "../redis/redis.service";
import { Screening } from "../screenings/schemas/screening.schema";

@Injectable()
export class SeatLockReconcilerService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly redis: RedisService,
    @InjectModel(Screening.name) private readonly screeningModel: Model<any>,
  ) {}

  onModuleInit(): void {
    // Periodic cleanup: release seats whose 10-minute Redis hold expired.
    // Pending bookings are intentionally left for staff or the customer.
    this.timer = setInterval(() => {
      void this.reconcileExpiredSeatLocks();
    }, 30_000);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  // Reverts seats whose Redis lock expired (key gone) but which are still held
  // in Mongo. Best-effort and silent on Redis outages, like the Express startup job.
  async reconcileExpiredSeatLocks(): Promise<void> {
    try {
      if (!this.redis.isRedisAvailable()) return;

      const screenings = await this.screeningModel
        .find({ "seats.status": "held" })
        .select("_id seats");

      for (const screening of screenings) {
        const heldSeats = screening.seats.filter(
          (s: any) => s.status === "held",
        );
        const expired: string[] = [];

        for (const seat of heldSeats) {
          const holder = await this.redis.getSeatLockHolder(
            String(screening._id),
            seat.label,
          );
          if (holder === null) expired.push(seat.label);
        }

        if (expired.length === 0) continue;

        await this.screeningModel.updateMany(
          { _id: screening._id, "seats.label": { $in: expired } },
          { $set: { "seats.$[elem].status": "available" } },
          {
            arrayFilters: [
              { "elem.label": { $in: expired }, "elem.status": "held" },
            ],
          },
        );
      }
    } catch (error) {
      console.error("Reconcile expired seat locks error:", error);
    }
  }
}
