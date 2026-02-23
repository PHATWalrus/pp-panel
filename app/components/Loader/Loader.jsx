import { BarLoader, MoonLoader, SquareLoader } from "react-spinners";
import "./Loader.scss"
import { RotatingLines } from "react-loader-spinner";
import Footer from "../Footer/Footer";

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
            <Footer />
        </div>
    )
}