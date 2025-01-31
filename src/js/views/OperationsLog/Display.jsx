import PropTypes from 'prop-types'
import React, { useContext } from 'react'
import { DateTime } from 'luxon'
import { Icon, Markdown } from '../../components'
import { useTranslation } from 'react-i18next'
import { DescriptionList } from '../../components/DescriptionList/DescriptionList'
import { Definition } from '../../components/DescriptionList/Definition'
import { Context } from '../../state'

function renderURLTemplate(urlTemplate, slug, environment) {
  return urlTemplate
    .replace('{environment}', environment.toString().toLowerCase())
    .replace('{slug}', slug.toString().toLowerCase())
}

function Display({ entry }) {
  const [globalState] = useContext(Context)
  const { t } = useTranslation()

  return (
    <DescriptionList>
      <Definition term={t('operationsLog.recordedBy')}>
        {entry.recorded_by}
      </Definition>
      <Definition term={t('operationsLog.environment')}>
        {entry.environment}
      </Definition>
      {(entry.project_name || entry.project_id) && (
        <Definition term={t('operationsLog.project')}>
          <a
            className="text-blue-800 hover:text-blue-700"
            href={`/ui/projects/${entry.project_id}`}
            title={entry.project_name}
            target="_blank">
            <Icon icon="fas external-link-alt" className="mr-2" />
            {entry.project_name || entry.project_id}
          </a>
        </Definition>
      )}
      <Definition term={t('operationsLog.changeType')}>
        {entry.change_type}
      </Definition>
      <Definition term={t('operationsLog.recordedAt')}>
        {DateTime.fromISO(entry.recorded_at).toLocaleString(
          DateTime.DATETIME_MED
        )}
      </Definition>
      {entry.completed_at && (
        <Definition term={t('operationsLog.completedAt')}>
          {DateTime.fromISO(entry.completed_at).toLocaleString(
            DateTime.DATETIME_MED
          )}
        </Definition>
      )}
      {entry.description && (
        <Definition term={t('operationsLog.description')}>
          {entry.description}
        </Definition>
      )}
      {entry.version && (
        <Definition term={t('operationsLog.version')}>
          {entry.version}
        </Definition>
      )}
      {entry.ticket_slug && (
        <Definition term={t('operationsLog.ticketSlug')}>
          {globalState.opsLogURLTemplate ? (
            <a
              className="text-blue-800 hover:text-blue-700"
              href={renderURLTemplate(
                globalState.opsLogURLTemplate,
                entry.ticket_slug,
                entry.environment
              )}
              title={entry.ticket_slug}
              target="_blank">
              <Icon icon="fas external-link-alt" className="mr-2" />
              {entry.ticket_slug}
            </a>
          ) : (
            entry.ticket_slug
          )}
        </Definition>
      )}
      {entry.link && (
        <Definition term={t('operationsLog.link')}>
          <a
            className="text-blue-800 hover:text-blue-700"
            href={entry.link}
            title={entry.link}
            target="_new">
            <Icon icon="fas external-link-alt" className="mr-2" />
            {entry.link}
          </a>
        </Definition>
      )}
      {entry.notes && (
        <Definition term={t('operationsLog.notes')}>
          <Markdown className="overflow-auto max-h-[30vh] border-solid border-2 p-2 rounded">
            {entry.notes}
          </Markdown>
        </Definition>
      )}
    </DescriptionList>
  )
}
Display.propTypes = {
  entry: PropTypes.object.isRequired
}
export { Display }
