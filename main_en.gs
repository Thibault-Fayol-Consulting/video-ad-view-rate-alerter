/**
 * --------------------------------------------------------------------------
 * Video Ad View Rate Alerter — Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Monitors view rates on Video campaigns via GAQL. Alerts via email,
 * applies labels, and optionally pauses underperforming campaigns.
 *
 * Author:  Thibault Fayol — Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  // -- General --
  TEST_MODE: true,                          // Set to false to apply changes
  EMAIL: 'contact@yourdomain.com',          // Alert recipient

  // -- Thresholds --
  VIEW_RATE_THRESHOLD: 0.15,                // 15% minimum view rate
  MIN_IMPRESSIONS: 1000,                    // Minimum impressions to evaluate
  DATE_RANGE: 'LAST_30_DAYS',              // Stats lookback period

  // -- Action mode --
  // "ALERT"      = email only (recommended default)
  // "LABEL_ONLY" = apply label, no email
  // "PAUSE"      = label + email + pause campaign (use with caution)
  ACTION: 'ALERT',

  // -- Labels --
  LOW_VIEW_RATE_LABEL: 'Low_View_Rate'
};

function main() {
  try {
    var today = Utilities.formatDate(new Date(), AdsApp.currentAccount().getTimeZone(), 'yyyy-MM-dd');
    Logger.log('Video View Rate Alerter — run started ' + today);

    createLabelIfNeeded_(CONFIG.LOW_VIEW_RATE_LABEL);

    // GAQL query for video campaign performance
    var query = 'SELECT campaign.name, campaign.id, '
      + 'metrics.impressions, metrics.video_views '
      + 'FROM campaign '
      + 'WHERE campaign.advertising_channel_type = \'VIDEO\' '
      + 'AND campaign.status = \'ENABLED\' '
      + 'AND metrics.impressions > ' + CONFIG.MIN_IMPRESSIONS + ' '
      + 'AND segments.date DURING ' + CONFIG.DATE_RANGE;

    var rows = AdsApp.search(query);
    var flagged = [];

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var impressions = parseInt(row.metrics.impressions, 10);
      var views = parseInt(row.metrics.videoViews, 10) || 0;
      var campName = row.campaign.name;
      var campId = row.campaign.id;
      var rate = impressions > 0 ? views / impressions : 0;

      if (rate < CONFIG.VIEW_RATE_THRESHOLD) {
        var line = campName
          + ' | View rate: ' + (rate * 100).toFixed(2) + '%'
          + ' | Views: ' + views
          + ' | Impressions: ' + impressions;
        Logger.log('LOW VIEW RATE: ' + line);
        flagged.push(line);

        if (!CONFIG.TEST_MODE) {
          // Apply label via campaign selector
          var campIter = AdsApp.videoCampaigns().withIds([campId]).get();
          if (campIter.hasNext()) {
            var camp = campIter.next();
            camp.applyLabel(CONFIG.LOW_VIEW_RATE_LABEL);

            if (CONFIG.ACTION === 'PAUSE') {
              camp.pause();
              Logger.log('PAUSED: ' + campName);
            }
          }
        }
      }
    }

    Logger.log('Campaigns flagged: ' + flagged.length);

    var shouldEmail = (CONFIG.ACTION === 'ALERT' || CONFIG.ACTION === 'PAUSE');
    if (flagged.length > 0 && shouldEmail && !CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@yourdomain.com') {
      var actionDesc = CONFIG.ACTION === 'PAUSE' ? 'Labeled + PAUSED' : 'Alert only (not paused)';
      var subject = 'Video View Rate Alert — ' + flagged.length + ' campaign(s) below ' + (CONFIG.VIEW_RATE_THRESHOLD * 100) + '%';
      var body = 'Date: ' + today + '\n'
        + 'Account: ' + AdsApp.currentAccount().getName() + '\n'
        + 'Threshold: ' + (CONFIG.VIEW_RATE_THRESHOLD * 100) + '%\n'
        + 'Action: ' + actionDesc + '\n\n'
        + flagged.join('\n');
      MailApp.sendEmail(CONFIG.EMAIL, subject, body);
    }

  } catch (e) {
    Logger.log('FATAL ERROR: ' + e.message);
    if (!CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@yourdomain.com') {
      MailApp.sendEmail(CONFIG.EMAIL, 'Video View Rate Alerter — Error', e.message);
    }
  }
}

function createLabelIfNeeded_(name) {
  if (!AdsApp.labels().withCondition("Name = '" + name + "'").get().hasNext()) {
    AdsApp.createLabel(name);
  }
}
