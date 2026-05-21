import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@pangcheng/server';

export const trpc = createTRPCReact<AppRouter>();
