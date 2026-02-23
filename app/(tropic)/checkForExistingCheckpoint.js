import { getBrowserTRPCClient } from "../utils/trpc/client";
import { getTargetId } from "./getTargetId";

export default async function checkForExistingCheckpoint(resolution) {
    try {
        const trpc = getBrowserTRPCClient();
        const targetId = await getTargetId();
        const exists = await trpc.checkpoints.existsWaiting.query({
            targetId,
            resolution,
        });
        return exists;
    } catch (error) {
        console.error('Error checking for existing checkpoint:', error);
        return false;
    }
}