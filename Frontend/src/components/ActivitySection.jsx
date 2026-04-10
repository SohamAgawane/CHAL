import PlanCard from "./ActivityCard";
import { activitiesData } from "../utils/activityData";
import { useState } from "react";

const ActivitySection = () => {
    const [searchText, setSearchText] = useState("");
    const [selectedType, setSelectedType] = useState("All Activities");

    // FILTER LOGIC
    const filteredActivities = activitiesData.filter((activity) => {
        const search = searchText.toLowerCase();

        const title = activity.title?.toLowerCase() || "";
        const location = activity.location?.toLowerCase() || "";
        const category = activity.category?.toLowerCase() || "";

        // Search match (empty search = show all)
        const matchesSearch =
            search === "" ||
            title.includes(search) ||
            location.includes(search) ||
            category.includes(search);

        // Type filter match
        const matchesType =
            selectedType === "All Activities" ||
            category.includes(selectedType.toLowerCase());

        return matchesSearch && matchesType;
    });

    return (
        <div className="activity-section">

            {/* LEFT - FILTERS */}
            <div className="filters">
                <h3>Filters</h3>

                <div className="filter-group">
                    <p className="filter-title">Search</p>
                    <input
                        type="text"
                        placeholder="Search activity, city, venue..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <p className="filter-title">Activity Type</p>
                    <ul>
                        {[
                            "All Activities",
                            "Sports",
                            "Trekking",
                            "Cycling",
                            "Running",
                            "Photography Walk",
                            "Board Games",
                            "Hackathon",
                            "Social Meetup",
                            "Yoga & Wellness",
                            "Music Jam",
                            "Camping",
                            "Other",
                        ].map((type) => (
                            <li
                                key={type}
                                className={selectedType === type ? "active" : ""}
                                onClick={() => setSelectedType(type)}
                            >
                                {type}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* RIGHT - CARDS */}
            <div className="activities">
                <h3 className="activity-count">
                    {filteredActivities.length} activities found
                </h3>

                <div className="card-container">
                    {filteredActivities.map((activity, index) => (
                        <PlanCard key={index} data={activity} />
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ActivitySection;