import "./Loader.scss"
import { RotatingLines } from "react-loader-spinner";

export default function Loader() {
    return (
        <div className="Loader">
            <div className="content">
                <div className="loaderHolder">
                    <RotatingLines
                        width="32"
                        strokeColor="gray"
                    />
                </div>
            </div>
        </div>
    )
}