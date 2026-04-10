import { FaBell } from "react-icons/fa";

const Header = () => {
    return (
        <div className="header">
            <div className="logo-container">
                <img className="logo" src="https://static.vecteezy.com/ti/gratis-vector/p1/6202817-groep-van-acht-mensen-logo-in-een-cirkel-personen-teamwork-vector.jpg" alt="logo" />
                <div className="logo-text">
                    <span className="logo-name">CHAL</span>
                    <span className="logo-sub"> find your crew</span>
                </div>
            </div>
            <div className="nav-items">
                <ul>
                    <li>Explore</li>
                    <li>My Activity</li>
                    <li>Profile</li>
                </ul>
            </div>
            <div className="right-nav-items">
                <ul>
                    <li><FaBell size={20} /></li>
                    <li><button>Host Activity</button></li>
                </ul>
            </div>
        </div>
    );
};

export default Header;