import { getTargetId } from "./getTargetId";
import { getBrowserTRPCClient } from "../utils/trpc/client";

export default async function proceedStep() {
    let targetId;
    try {
        targetId = await getTargetId();
        if(!targetId){
            throw new Error('Missing target ID');
        }
        const trpc = getBrowserTRPCClient();
        const response = await trpc.intakeState.incrementStep.mutate({ targetId });
        const data = response?.data ?? 0;

        if (data === null || data < 1) {
            console.warn(`No rows updated for target ID: ${targetId}`)
        }

        return { data: data ?? 0 }
    } catch (error) {
        console.error(`Failed to increment step for target ${targetId}:`, error)
        return { error }
    }
}