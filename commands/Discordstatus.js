const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const crypto = require('crypto');

const BASE = 'https://discordstatus.com/api/v2';
const ENDPOINTS = {
  summary: `${BASE}/summary.json`,
  unresolvedIncidents: `${BASE}/incidents/unresolved.json`,
  activeMaintenances: `${BASE}/scheduled-maintenances/active.json`,
  upcomingMaintenances: `${BASE}/scheduled-maintenances/upcoming.json`,
};

// How often to poll for changes (ms). Message only gets edited if something actually changed.
const POLL_INTERVAL = 2 * 60 * 1000; // 2 min
// Stop polling after this long so intervals don't pile up forever
const MAX_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const MAX_ITEMS_PER_SECTION = 5; // cap so we don't blow past Components V2 char limits

const INDICATOR_MAP = {
  none: { color: 0x3ba55d, emoji: '🟢' },
  minor: { color: 0xfaa61a, emoji: '🟡' },
  major: { color: 0xed4245, emoji: '🟠' },
  critical: { color: 0x992d22, emoji: '🔴' },
};

const IMPACT_EMOJI = {
  none: '⚪',
  minor: '🟡',
  major: '🟠',
  critical: '🔴',
  maintenance: '🔧',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('discordstatus')
    .setDescription('Posts a live-updating overview of Discord incidents, outages, and maintenance'),

  async execute(interaction) {
    let lastSignature = null;

    const fetchAll = async () => {
      const [summary, unresolved, activeMaint, upcomingMaint] = await Promise.all([
        fetchJSON(ENDPOINTS.summary),
        fetchJSON(ENDPOINTS.unresolvedIncidents),
        fetchJSON(ENDPOINTS.activeMaintenances),
        fetchJSON(ENDPOINTS.upcomingMaintenances),
      ]);
      return { summary, unresolved, activeMaint, upcomingMaint };
    };

    const buildContainer = ({ summary, unresolved, activeMaint, upcomingMaint }) => {
      const indicator = summary.status?.indicator ?? 'none';
      const { color, emoji } = INDICATOR_MAP[indicator] || INDICATOR_MAP.none;
      const description = summary.status?.description ?? 'All Systems Operational';

      const container = new ContainerBuilder().setAccentColor(color);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${emoji} Discord Status: ${description}`)
      );
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

      // Components
      const componentLines = (summary.components || [])
        .filter((c) => !c.group)
        .map((c) => `${statusEmoji(c.status)} ${c.name} — ${prettyStatus(c.status)}`)
        .join('\n');
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Components**\n${componentLines || 'No data'}`)
      );
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

      // Active incidents / outages
      const incidents = (unresolved.incidents || []).slice(0, MAX_ITEMS_PER_SECTION);
      const incidentText =
        incidents.length > 0
          ? incidents.map((i) => formatIncident(i)).join('\n\n')
          : 'None currently. ✅';
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**🚨 Active Incidents / Outages**\n${incidentText}`)
      );
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

      // Maintenance (active + upcoming)
      const maintenances = [
        ...(activeMaint.scheduled_maintenances || []),
        ...(upcomingMaint.scheduled_maintenances || []),
      ].slice(0, MAX_ITEMS_PER_SECTION);
      const maintenanceText =
        maintenances.length > 0
          ? maintenances.map((m) => formatMaintenance(m)).join('\n\n')
          : 'None scheduled.';
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**🔧 Scheduled / Active Maintenance**\n${maintenanceText}`)
      );
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Source: discordstatus.com • Checked <t:${Math.floor(Date.now() / 1000)}:R> • Updates automatically`
        )
      );

      return container;
    };

    // Build a signature from only the fields that matter, so timestamp noise doesn't force edits
    const signatureOf = ({ summary, unresolved, activeMaint, upcomingMaint }) =>
      crypto
        .createHash('sha1')
        .update(
          JSON.stringify({
            status: summary.status,
            components: (summary.components || []).map((c) => ({ id: c.id, status: c.status })),
            incidents: (unresolved.incidents || []).map((i) => ({
              id: i.id,
              status: i.status,
              updated_at: i.updated_at,
            })),
            active: (activeMaint.scheduled_maintenances || []).map((m) => m.id + m.status),
            upcoming: (upcomingMaint.scheduled_maintenances || []).map((m) => m.id + m.status),
          })
        )
        .digest('hex');

    const data = await fetchAll();
    lastSignature = signatureOf(data);

    await interaction.reply({
      components: [buildContainer(data)],
      flags: MessageFlags.IsComponentsV2,
    });
    const message = await interaction.fetchReply();

    const interval = setInterval(async () => {
      try {
        const fresh = await fetchAll();
        const sig = signatureOf(fresh);
        if (sig !== lastSignature) {
          lastSignature = sig;
          await message.edit({
            components: [buildContainer(fresh)],
            flags: MessageFlags.IsComponentsV2,
          });
        }
      } catch (err) {
        // API hiccup, or message deleted / no longer editable — stop rather than error loop
        if (err?.code === 10008 || err?.code === 50001) {
          clearInterval(interval);
        }
      }
    }, POLL_INTERVAL);

    setTimeout(() => clearInterval(interval), MAX_DURATION);
  },
};

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

function statusEmoji(status) {
  switch (status) {
    case 'operational':
      return '🟢';
    case 'degraded_performance':
      return '🟡';
    case 'partial_outage':
      return '🟠';
    case 'major_outage':
      return '🔴';
    case 'under_maintenance':
      return '🔧';
    default:
      return '⚪';
  }
}

function prettyStatus(status) {
  return (status || 'unknown').replace(/_/g, ' ');
}

function formatIncident(incident) {
  const emoji = IMPACT_EMOJI[incident.impact] || '⚪';
  const latestUpdate = incident.incident_updates?.[0];
  const updateBody = latestUpdate ? truncate(latestUpdate.body, 300) : 'No update text.';
  const startedTs = Math.floor(new Date(incident.created_at).getTime() / 1000);

  return (
    `${emoji} **${incident.name}**\n` +
    `Status: \`${prettyStatus(incident.status)}\` • Started <t:${startedTs}:R>\n` +
    `> ${updateBody}\n` +
    `[View incident](${incident.shortlink})`
  );
}

function formatMaintenance(maint) {
  const start = Math.floor(new Date(maint.scheduled_for).getTime() / 1000);
  const end = Math.floor(new Date(maint.scheduled_until).getTime() / 1000);
  const latestUpdate = maint.incident_updates?.[0];
  const updateBody = latestUpdate ? truncate(latestUpdate.body, 200) : '';

  return (
    `🔧 **${maint.name}**\n` +
    `Status: \`${prettyStatus(maint.status)}\` • <t:${start}:f> → <t:${end}:t>\n` +
    (updateBody ? `> ${updateBody}\n` : '') +
    `[View details](${maint.shortlink})`
  );
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max)}…` : str;
}