import { atom } from 'jotai';
import { getTargetId } from './getTargetId';

export const targetIdAtom = atom(await getTargetId());