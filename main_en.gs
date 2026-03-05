/**
 * --------------------------------------------------------------------------
 * video-ad-view-rate-alerter - Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Author: Thibault Fayol - Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */
var CONFIG = { TEST_MODE: true, MIN_VIEW_RATE: 0.15 };
function main() {
    var campIter = AdsApp.videoCampaigns().withCondition("Status = ENABLED").forDateRange("LAST_30_DAYS").get();
    while(campIter.hasNext()){
       var camp = campIter.next();
       var stats = camp.getStatsFor("LAST_30_DAYS");
       var views = stats.getViews();
       var impressions = stats.getImpressions();
       if (impressions > 1000) {
           var rate = views / impressions;
           if (rate < CONFIG.MIN_VIEW_RATE) {
               Logger.log("WARNING: View rate of " + (rate*100).toFixed(2) + "% for " + camp.getName());
               if (!CONFIG.TEST_MODE) camp.pause(); // Aggressive cut
           }
       }
    }
}
