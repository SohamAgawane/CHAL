import { MdOutlinePlace, MdOutlineDateRange, MdOutlineAccessTime } from "react-icons/md";
import { FiUsers } from "react-icons/fi";

const ActivityCard = ({ data }) => {
    const [filled, total] = data.ratio.split("/").map(Number);
    
    const progress = (filled / total) * 100;
    const isFull = filled === total;

    return (
        <div className={`activity-card ${data.color}`}>

            <div className="card-top">
                <div className="card-head">
                    <div className="activity-icon">{data.icon}</div>

                    <div className="card-title-block">
                        <p className="category">{data.category}</p>
                        <h3>{data.title}</h3>
                    </div>
                </div>

                <div className="meta">
                    <div className="meta-row">
                        <MdOutlinePlace />
                        <span>{data.location}</span>
                    </div>

                    <div className="meta-inline">
                        <div className="meta-row">
                            <MdOutlineDateRange />
                            <span>{data.date}</span>
                        </div>

                        <div className="meta-row">
                            <MdOutlineAccessTime />
                            <span>{data.time}</span>
                        </div>
                    </div>
                </div>

                <div className="tags-row">
                    <span className="tag">{data.level}</span>
                    <span className={data.price === "Free" ? "price free" : "price"}>
                        {data.price}
                    </span>
                </div>
            </div>

            <div className="card-bottom">
                <div className="card-divider"></div>

                <div className="spots-row">
                    <div className="spots-left">
                        <FiUsers />
                        <span className={isFull ? "spots-full" : ""}>
                            {isFull ? "Full" : data.spots}
                        </span>
                    </div>
                    <span>{data.ratio}</span>
                </div>

                <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

        </div>
    );
};

export default ActivityCard;