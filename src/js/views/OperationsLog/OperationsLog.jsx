import React, { useContext, useEffect, useRef, useState } from 'react'

import { Context } from '../../state'
import { Filter } from '../Projects/Filter'
import { Alert, Icon, Table } from '../../components'
import {
  fromKueryExpression,
  toElasticsearchQuery
} from '@cybernetex/kbn-es-query'
import { metadataAsOptions } from '../../settings'
import { httpPost } from '../../utils'
import { useTranslation } from 'react-i18next'
import { HelpDialog } from '../Projects/HelpDialog'
import { useSearchParams } from 'react-router-dom'
import { ViewOperationsLog } from './ViewOperationsLog'
import { SlideOver } from '../../components/SlideOver/SlideOver'
import PropTypes from 'prop-types'

function cloneParams(searchParams) {
  const newParams = new URLSearchParams()
  for (const [key, value] of searchParams) {
    newParams.set(key, value)
  }
  return newParams
}

function OperationsLog({ projectID, urlPath, className }) {
  const [globalState, dispatch] = useContext(Context)
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState(
    searchParams.get('f') ? searchParams.get('f') : ''
  )
  const [onFetch, setOnFetch] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [deletedID, setDeletedID] = useState()
  const [rows, setRows] = useState([])
  const [errorMessage, setErrorMessage] = useState()
  const [showHelp, setShowHelp] = useState(false)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState()
  const [slideOverFocusTrigger, setSlideOverFocusTrigger] = useState({})
  const [showArrows, setShowArrows] = useState(false)
  const arrowLeftRef = useRef(null)
  const arrowRightRef = useRef(null)
  const { t } = useTranslation()

  if (searchParams.get('v') && !slideOverOpen) {
    setSlideOverOpen(true)
    setShowArrows(true)
  } else if (!searchParams.get('v') && slideOverOpen) {
    setSlideOverOpen(false)
    setShowArrows(false)
  }

  if (deletedID) {
    setRows((prevRows) => prevRows.filter((r) => r.id !== deletedID))
    setDeletedID(null)
  }

  if (searchParams.get('v') && slideOverOpen && selectedIndex === undefined) {
    let index
    rows.forEach((entry, i) => {
      if (entry.id === parseInt(searchParams.get('v'))) {
        index = i
      }
    })
    if (index !== undefined) {
      setSelectedIndex(index)
      setShowArrows(true)
    }
  }

  useEffect(() => {
    const path = urlPath ? `${urlPath}/operations-log` : 'ui/operations-log'
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'operationsLog.title',
        url: new URL(path, globalState.baseURL)
      }
    })
  }, [])

  useEffect(() => {
    if (fetching || !onFetch) return
    setFetching(true)

    let query = filter.trim()
    if (projectID) {
      query += query
        ? ` AND project_id:${projectID}`
        : `project_id:${projectID}`
    }

    const payload = {
      query: toElasticsearchQuery(
        fromKueryExpression(query),
        metadataAsOptions.openSearch
      ),
      sort: [{ recorded_at: { order: 'desc' } }],
      fields: globalState.fields,
      size: 1000
    }

    httpPost(
      globalState.fetch,
      buildURL('/opensearch/operations-log'),
      payload
    ).then(({ data, success }) => {
      if (success) {
        setErrorMessage(null)
        setRows(
          data.hits.hits
            .map((hit) => hit._source)
            .filter((r) => r.id !== deletedID)
        )
        setDeletedID(null)
      } else {
        setErrorMessage(t('operationsLog.requestError', { error: data }))
      }
      setFetching(false)
      setOnFetch(false)
    })
  }, [onFetch])

  function move(index) {
    setSelectedIndex(index)
    const newParams = cloneParams(searchParams)
    newParams.set('v', rows[index].id)
    setSearchParams(newParams)
  }

  function buildURL(path) {
    return new URL(path, globalState.baseURL)
  }

  function buildColumns() {
    const columns = [
      {
        title: t('operationsLog.recordedAt'),
        name: 'recorded_at',
        type: 'datetime',
        tableOptions: {
          headerClassName: 'w-2/12 truncate',
          className: 'truncate'
        }
      },
      {
        title: t('operationsLog.environment'),
        name: 'environment',
        type: 'text',
        tableOptions: {
          headerClassName: 'w-2/12'
        }
      }
    ]

    if (!projectID) {
      columns.push({
        title: t('operationsLog.project'),
        name: 'project_name',
        type: 'text',
        tableOptions: {
          headerClassName: 'w-2/12',
          className: 'truncate'
        }
      })
    }

    return columns.concat([
      {
        title: t('operationsLog.changeType'),
        name: 'change_type',
        type: 'text',
        tableOptions: {
          headerClassName: 'w-2/12 truncate'
        }
      },
      {
        title: t('operationsLog.description'),
        name: 'description',
        type: 'text',
        tableOptions: {
          className: 'truncate'
        }
      },
      {
        title: t('operationsLog.recordedBy'),
        name: 'recorded_by',
        type: 'text',
        tableOptions: {
          headerClassName: 'w-2/12 truncate',
          className: 'truncate'
        }
      }
    ])
  }

  return (
    <div className={`m-0 space-y-3 ${className}`}>
      {errorMessage && (
        <Alert className="mt-3" level="error">
          {errorMessage}
        </Alert>
      )}
      <Filter
        disabled={fetching}
        onChange={(value) => setFilter(value)}
        onSubmit={() => {
          setSearchParams(new URLSearchParams({ f: filter }))
          setOnFetch(true)
        }}
        onRefresh={() => {
          setFilter(searchParams.get('f') ? searchParams.get('f') : '')
          setOnFetch(true)
        }}
        onShowHelp={() => setShowHelp(true)}
        value={filter}
      />
      <Table
        columns={buildColumns()}
        data={rows}
        onRowClick={({ index }) => {
          const newParams = cloneParams(searchParams)
          newParams.set('v', rows[index].id)
          setSearchParams(newParams)
          setSlideOverOpen(true)
          setSelectedIndex(index)
          setShowArrows(true)
        }}
        checkIsHighlighted={(row) => row.id === parseInt(searchParams.get('v'))}
      />
      <SlideOver
        open={slideOverOpen}
        title={
          <div className="flex items-center">
            {t('operationsLog.entry')}
            {selectedIndex !== undefined && showArrows && (
              <>
                <button
                  ref={arrowLeftRef}
                  className="ml-4 mr-2 h-min outline-offset-4"
                  onClick={() => {
                    if (selectedIndex > 0) move(selectedIndex - 1)
                  }}
                  tabIndex={selectedIndex === 0 ? -1 : 0}>
                  <Icon
                    icon="fas arrow-left"
                    className={
                      'h-4 select-none block' +
                      (selectedIndex === 0 ? ' text-gray-200' : '')
                    }
                  />
                </button>

                <button
                  ref={arrowRightRef}
                  className="outline-offset-4"
                  onClick={() => {
                    if (selectedIndex < rows.length - 1) move(selectedIndex + 1)
                  }}
                  tabIndex={selectedIndex === rows.length - 1 ? -1 : 0}>
                  <Icon
                    icon="fas arrow-right"
                    className={
                      'h-4 select-none block' +
                      (selectedIndex === rows.length - 1
                        ? ' text-gray-200'
                        : '')
                    }
                  />
                </button>
              </>
            )}
          </div>
        }
        onClose={() => {
          const newParams = cloneParams(searchParams)
          newParams.delete('v')
          setSearchParams(newParams)
          if (updated) {
            setOnFetch(true)
            setUpdated(false)
          }
          setSlideOverOpen(false)
          setSelectedIndex(null)
        }}
        onKeyDown={(e) => {
          if (!showArrows) return
          if (selectedIndex > 0 && e.key === 'ArrowLeft') {
            arrowLeftRef.current?.focus()
            move(selectedIndex - 1)
          } else if (
            selectedIndex < rows.length - 1 &&
            e.key === 'ArrowRight'
          ) {
            arrowRightRef.current?.focus()
            move(selectedIndex + 1)
          }
        }}
        focusTrigger={slideOverFocusTrigger}>
        <ViewOperationsLog
          cachedEntry={rows[selectedIndex]}
          operationsLogID={parseInt(searchParams.get('v'))}
          onUpdate={() => setUpdated(true)}
          onDelete={(operationsLogID) => {
            const newParams = cloneParams(searchParams)
            newParams.delete('v')
            setSearchParams(newParams)
            setDeletedID(operationsLogID)
          }}
          onEditOpen={() => setShowArrows(false)}
          onDeleteOpen={() => setShowArrows(false)}
          onEditClose={() => {
            setShowArrows(true)
            setSlideOverFocusTrigger({})
          }}
          onDeleteClose={() => {
            setShowArrows(true)
            setSlideOverFocusTrigger({})
          }}
        />
      </SlideOver>

      {showHelp && (
        <HelpDialog
          onClose={() => setShowHelp(false)}
          title={t('operationsLog.searchHelpTitle')}
          searchHelp={t('operationsLog.searchHelp')}
          fields={[
            'change_type',
            'description',
            'project_id',
            'project_name',
            'environment',
            'recorded_by',
            'recorded_at',
            'link',
            'notes',
            'version'
          ]}
        />
      )}
    </div>
  )
}
OperationsLog.propTypes = {
  projectID: PropTypes.number,
  urlPath: PropTypes.string,
  className: PropTypes.string
}
export { OperationsLog }
