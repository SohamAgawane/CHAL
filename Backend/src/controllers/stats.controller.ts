import { Plan } from "../models/Plan.model.js";
import { Join } from "../models/Join.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//  GET /api/stats ─
const getStats = asyncHandler(async (_req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const result = await Plan.aggregate([
    {
      $facet: {
        totalPlansToday: [
          { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
          { $count: "count" },
        ],
        totalPlansAllTime: [{ $count: "count" }],
        avgJoinsPerPlan: [{ $group: { _id: null, avg: { $avg: "$joinedCount" } } }],
      },
    },
  ]);

  const joinsToday = await Join.countDocuments({
    createdAt: { $gte: todayStart, $lte: todayEnd },
    status: "approved",
  });

  const stats = {
    totalPlansToday: result[0].totalPlansToday[0]?.count || 0,
    totalPlansAllTime: result[0].totalPlansAllTime[0]?.count || 0,
    joinsToday,
    avgJoinsPerPlan: Math.round(result[0].avgJoinsPerPlan[0]?.avg || 0),
  };

  return res.status(200).json(new ApiResponse(200, stats, "Stats fetched"));
});

export { getStats };