import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';
import { PrismaNeon } from '@prisma/adapter-neon';
export declare const prisma: PrismaClient<{
    adapter: PrismaNeon;
}, never, import("../generated/prisma/runtime/client").DefaultArgs>;
//# sourceMappingURL=db.d.ts.map