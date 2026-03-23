/**
 * --------------------------------------------------------------------------
 * Video Ad View Rate Alerter — Script Google Ads pour PME
 * --------------------------------------------------------------------------
 * Surveille les taux de vue des campagnes Video via GAQL. Alerte par
 * email, applique des labels et peut optionnellement mettre en pause.
 *
 * Auteur :  Thibault Fayol — Consultant SEA PME
 * Site :    https://thibaultfayol.com
 * Licence : MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  // -- General --
  TEST_MODE: true,
  EMAIL: 'contact@votredomaine.com',

  // -- Seuils --
  VIEW_RATE_THRESHOLD: 0.15,
  MIN_IMPRESSIONS: 1000,
  DATE_RANGE: 'LAST_30_DAYS',

  // -- Mode d action --
  // "ALERT"      = email uniquement (defaut recommande)
  // "LABEL_ONLY" = label seulement, pas d email
  // "PAUSE"      = label + email + pause campagne
  ACTION: 'ALERT',

  // -- Labels --
  LOW_VIEW_RATE_LABEL: 'Low_View_Rate'
};

function main() {
  try {
    var today = Utilities.formatDate(new Date(), AdsApp.currentAccount().getTimeZone(), 'yyyy-MM-dd');
    Logger.log('Video View Rate Alerter — execution du ' + today);

    createLabelIfNeeded_(CONFIG.LOW_VIEW_RATE_LABEL);

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
          + ' | Taux de vue : ' + (rate * 100).toFixed(2) + '%'
          + ' | Vues : ' + views
          + ' | Impressions : ' + impressions;
        Logger.log('TAUX DE VUE BAS : ' + line);
        flagged.push(line);

        if (!CONFIG.TEST_MODE) {
          var campIter = AdsApp.videoCampaigns().withIds([campId]).get();
          if (campIter.hasNext()) {
            var camp = campIter.next();
            camp.applyLabel(CONFIG.LOW_VIEW_RATE_LABEL);

            if (CONFIG.ACTION === 'PAUSE') {
              camp.pause();
              Logger.log('EN PAUSE : ' + campName);
            }
          }
        }
      }
    }

    Logger.log('Campagnes signalees : ' + flagged.length);

    var shouldEmail = (CONFIG.ACTION === 'ALERT' || CONFIG.ACTION === 'PAUSE');
    if (flagged.length > 0 && shouldEmail && !CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@votredomaine.com') {
      var actionDesc = CONFIG.ACTION === 'PAUSE' ? 'Label + PAUSE' : 'Alerte uniquement (pas de pause)';
      var subject = 'Alerte Taux de Vue — ' + flagged.length + ' campagne(s) sous ' + (CONFIG.VIEW_RATE_THRESHOLD * 100) + '%';
      var body = 'Date : ' + today + '\n'
        + 'Compte : ' + AdsApp.currentAccount().getName() + '\n'
        + 'Seuil : ' + (CONFIG.VIEW_RATE_THRESHOLD * 100) + '%\n'
        + 'Action : ' + actionDesc + '\n\n'
        + flagged.join('\n');
      MailApp.sendEmail(CONFIG.EMAIL, subject, body);
    }

  } catch (e) {
    Logger.log('ERREUR FATALE : ' + e.message);
    if (!CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@votredomaine.com') {
      MailApp.sendEmail(CONFIG.EMAIL, 'Video View Rate Alerter — Erreur', e.message);
    }
  }
}

function createLabelIfNeeded_(name) {
  if (!AdsApp.labels().withCondition("Name = '" + name + "'").get().hasNext()) {
    AdsApp.createLabel(name);
  }
}
