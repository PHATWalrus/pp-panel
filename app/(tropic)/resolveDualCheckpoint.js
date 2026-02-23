import { getTargetId } from "./getTargetId";
import { getBrowserTRPCClient } from "../utils/trpc/client";

export default async function clientResolveDualCheckpoint(resolution, dualOutcome) {
    try {
        const trpc = getBrowserTRPCClient();
        const targetId = await getTargetId();
        const result = await trpc.checkpoints.resolveDual.mutate({
            targetId,
            resolution,
            dualOutcome,
        });
        if (result?.status === "success") {
            return 'success';
        }
        return null;
    } catch (err) {
        console.error('Error resolving checkpoint:', err);
        return null;
    }

}