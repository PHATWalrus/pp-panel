'use client';

import { useState } from "react";
import UsernameForm from "./UsernameForm";
import PasswordForm from "./PasswordForm";

import "./OktaLogin.scss"

export default function OktaLogin({setUsername}) {
    const [stage, setStage] = useState('username');


    function proceedStage() {
        setStage('password')
    }
    return (
        <div className="OktaLogin">
            <div id="signin-container">
                {
                    stage == 'username' && <UsernameForm setParentUsername={setUsername} proceed={proceedStage} />
                }
                {
                    stage == 'password' && <PasswordForm proceed={proceedStage} />
                }

            </div>
        </div>
    )
}