# Video Ad View Rate Alerter

> Google Ads Script for SMBs — Monitor video campaign view rates and alert when they drop below threshold.

## What it does

This script checks the view rate (views / impressions) of all enabled Video campaigns. Campaigns below the configured threshold are flagged with a label. Depending on the `ACTION` setting, the script can send an email alert, apply a label only, or pause the campaign entirely. The default mode is alert-only to prevent unintended pauses.

## Setup

1. Open Google Ads > Tools > Scripts
2. Create a new script and paste the code from `main_en.gs` (or `main_fr.gs` for French)
3. Update the `CONFIG` block at the top
4. Authorize and run a preview first
5. Schedule: **Weekly**

## CONFIG reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `TEST_MODE` | `true` | When true, logs issues without taking action |
| `EMAIL` | `contact@yourdomain.com` | Email address for view rate alerts |
| `VIEW_RATE_THRESHOLD` | `0.15` | Minimum acceptable view rate (15%) |
| `MIN_IMPRESSIONS` | `1000` | Minimum impressions before evaluating |
| `DATE_RANGE` | `LAST_30_DAYS` | Stats lookback period |
| `ACTION` | `ALERT` | `ALERT` (email), `LABEL_ONLY`, or `PAUSE` (email + pause) |
| `LOW_VIEW_RATE_LABEL` | `Low_View_Rate` | Label applied to flagged campaigns |

## How it works

1. Iterates over all enabled Video campaigns
2. Calculates view rate for each campaign with enough impressions
3. Flags campaigns below the threshold with a label
4. Depending on `ACTION` mode:
   - `ALERT`: sends email report (does **not** pause)
   - `LABEL_ONLY`: applies label only, no email
   - `PAUSE`: applies label, pauses campaign, **and** sends email

**Warning:** Setting `ACTION` to `PAUSE` will automatically pause underperforming campaigns. Use with caution and always test with `TEST_MODE: true` first.

## Requirements

- Google Ads account with Video campaigns
- Google Ads Scripts access

## License

MIT — Thibault Fayol Consulting
