import { getBrowserTRPCClient } from "../utils/trpc/client";

export default async function addIntakeEvent(intakeEvent) {
    try {
        const trpc = getBrowserTRPCClient();
        await trpc.intakeEvents.add.mutate(intakeEvent);
        console.log('successfully added ie')
    } catch (error) {
        console.error(error);
        return;
    }
}